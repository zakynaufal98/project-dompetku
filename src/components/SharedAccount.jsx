import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users, UserPlus, X, Mail, Check, XCircle, Trash2, Shield, Eye, Edit3, Loader2, ChevronDown } from 'lucide-react'

export default function SharedAccount() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')

  // Data: orang yang saya undang + undangan masuk ke saya
  const [myInvites, setMyInvites] = useState([]) // saya sebagai owner
  const [incomingInvites, setIncomingInvites] = useState([]) // saya sebagai member

  const loadShared = useCallback(async () => {
    if (!user) return
    const [ownRes, memRes] = await Promise.all([
      supabase.from('shared_accounts').select('*').eq('owner_id', user.id),
      supabase.from('shared_accounts').select('*').eq('member_id', user.id),
    ])
    if (!ownRes.error) setMyInvites(ownRes.data || [])
    if (!memRes.error) setIncomingInvites(memRes.data || [])
  }, [user])

  useEffect(() => { loadShared() }, [loadShared])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setErr('Email wajib diisi'); return }
    if (inviteEmail.trim().toLowerCase() === user.email?.toLowerCase()) { setErr('Tidak bisa mengundang diri sendiri'); return }
    
    setBusy(true); setErr(''); setSuccess('')

    // Cari user berdasarkan email di auth.users (via RPC atau lookup)
    // Karena kita tidak bisa query auth.users langsung, kita simpan dulu dengan member_id kosong
    // dan cari via Supabase Auth admin API — tapi dari frontend kita pakai trick:
    // Insert dulu, lalu member yang login akan melihat undangan berdasarkan email match
    
    // Alternatif: kita coba cari dari shared_accounts yang sudah ada
    // Untuk MVP, kita gunakan pendekatan "invite by email" yang di-match saat member login

    // Cek duplikat
    const existing = myInvites.find(i => i.member_email?.toLowerCase() === inviteEmail.trim().toLowerCase())
    if (existing) { setErr('Email ini sudah diundang'); setBusy(false); return }

    // Kita perlu member_id — coba lookup dari profil/shared yang sudah ada
    // Workaround: gunakan Supabase function atau insert dengan member_id = null
    // Tapi FK constraint butuh member_id valid...
    
    // Solusi: Kita lookup user via supabase.auth.admin (tidak tersedia di client)
    // Jadi kita buat RPC function, atau kita gunakan trik: 
    // Insert ke tabel tanpa FK dulu, atau buat lookup table

    // PRAGMATIC APPROACH: Gunakan supabase rpc atau query profiles
    // Untuk sekarang, kita coba match dari data yang bisa diakses
    
    const { data: lookupData, error: lookupErr } = await supabase.rpc('get_user_id_by_email', { email_input: inviteEmail.trim().toLowerCase() })
    
    if (lookupErr || !lookupData) {
      // Fallback: insert tanpa member_id check (perlu adjust DB)
      // Atau tampilkan error
      setErr('User dengan email tersebut belum terdaftar di DompetKu. Pastikan mereka sudah mendaftar terlebih dahulu.')
      setBusy(false)
      return
    }

    const memberId = lookupData

    const { error } = await supabase.from('shared_accounts').insert({
      owner_id: user.id,
      member_id: memberId,
      member_email: inviteEmail.trim().toLowerCase(),
      owner_email: user.email,
      role: inviteRole,
      status: 'pending',
    })

    setBusy(false)
    if (error) {
      if (error.code === '23505') setErr('User ini sudah diundang sebelumnya')
      else setErr(error.message)
    } else {
      setSuccess(`Undangan berhasil dikirim ke ${inviteEmail}`)
      setInviteEmail('')
      loadShared()
    }
  }

  const handleRespond = async (id, newStatus) => {
    setBusy(true)
    await supabase.from('shared_accounts').update({ status: newStatus }).eq('id', id)
    setBusy(false)
    loadShared()
  }

  const handleRemove = async (id) => {
    setBusy(true)
    await supabase.from('shared_accounts').delete().eq('id', id)
    setBusy(false)
    loadShared()
  }

  const acceptedIncoming = incomingInvites.filter(i => i.status === 'accepted')
  const pendingIncoming = incomingInvites.filter(i => i.status === 'pending')
  const acceptedOutgoing = myInvites.filter(i => i.status === 'accepted')
  const pendingOutgoing = myInvites.filter(i => i.status === 'pending')
  const totalConnections = acceptedIncoming.length + acceptedOutgoing.length

  return (
    <>
      {/* MINI CARD di Dashboard */}
      <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-text tracking-tight">Akun Bersama</h3>
              <p className="text-xs font-medium text-muted mt-0.5">
                {totalConnections > 0 ? `${totalConnections} koneksi aktif` : 'Belum ada koneksi'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="text-sm font-bold text-income bg-income-light hover:opacity-80 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <UserPlus size={16} strokeWidth={2.5} /> Kelola
          </button>
        </div>

        {/* Pending invitations badge */}
        {pendingIncoming.length > 0 && (
          <div className="bg-invest-light border border-invest/20 rounded-xl p-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-invest" />
              <span className="text-sm font-bold text-invest">{pendingIncoming.length} undangan masuk menunggu</span>
            </div>
            <button onClick={() => setShowModal(true)} className="text-xs font-bold text-invest underline">Lihat</button>
          </div>
        )}

        {/* Active connections list */}
        {acceptedIncoming.length > 0 && (
          <div className="mt-3 space-y-2">
            {acceptedIncoming.slice(0, 2).map(inv => (
              <div key={inv.id} className="flex items-center justify-between bg-bg border border-border2 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                    {inv.owner_email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-text-2 truncate">{inv.owner_email}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${inv.role === 'editor' ? 'bg-income-light text-income' : 'bg-border text-muted'}`}>
                  {inv.role === 'editor' ? 'Editor' : 'Viewer'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL KELOLA */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setShowModal(false) }}
        >
          <div className="bg-surface rounded-[24px] p-6 w-full max-w-lg shadow-2xl animate-fade-up cursor-default max-h-[85vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <Users size={20} className="text-indigo-500" /> Akun Bersama
              </h3>
              <button onClick={() => { setShowModal(false); setErr(''); setSuccess('') }} className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* FORM UNDANG */}
            <div className="bg-bg border border-border2 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Undang Anggota Baru</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2"><Mail size={16} /></div>
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={(e) => { setInviteEmail(e.target.value); setErr(''); setSuccess('') }}
                    placeholder="Email anggota..."
                    className="w-full bg-field border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder:text-muted2 focus:border-income outline-none"
                  />
                </div>
                <div className="relative">
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-field border border-border rounded-xl px-3 py-3 text-sm font-bold text-text-2 cursor-pointer outline-none appearance-none pr-8"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[10px] text-muted flex-1">
                  <strong>Editor</strong> bisa menambah & menghapus transaksi. <strong>Viewer</strong> hanya bisa melihat.
                </p>
                <button 
                  onClick={handleInvite} 
                  disabled={busy || !inviteEmail.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Undang
                </button>
              </div>
              {err && <p className="text-xs text-expense bg-expense-light rounded-lg px-3 py-2 mt-2 font-medium">{err}</p>}
              {success && <p className="text-xs text-income bg-income-light rounded-lg px-3 py-2 mt-2 font-medium">{success}</p>}
            </div>

            {/* UNDANGAN MASUK */}
            {pendingIncoming.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-invest uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Mail size={14} /> Undangan Masuk ({pendingIncoming.length})
                </p>
                <div className="space-y-2">
                  {pendingIncoming.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-invest-light/50 border border-invest/20 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text truncate">{inv.owner_email}</p>
                        <p className="text-[10px] text-muted font-medium">mengundangmu sebagai <strong>{inv.role === 'editor' ? 'Editor' : 'Viewer'}</strong></p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        <button onClick={() => handleRespond(inv.id, 'accepted')} disabled={busy} className="w-8 h-8 rounded-lg bg-income text-white flex items-center justify-center hover:opacity-80 transition-colors"><Check size={16} /></button>
                        <button onClick={() => handleRespond(inv.id, 'rejected')} disabled={busy} className="w-8 h-8 rounded-lg bg-expense text-white flex items-center justify-center hover:opacity-80 transition-colors"><XCircle size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANGGOTA YANG SAYA UNDANG */}
            <div className="mb-6">
              <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Anggota yang Saya Undang</p>
              {myInvites.length === 0 ? (
                <p className="text-sm text-muted2 bg-bg rounded-xl p-4 text-center">Belum ada anggota yang diundang</p>
              ) : (
                <div className="space-y-2">
                  {myInvites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-bg border border-border2 rounded-xl p-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {inv.member_email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text truncate">{inv.member_email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              inv.status === 'accepted' ? 'bg-income-light text-income' : 
                              inv.status === 'pending' ? 'bg-invest-light text-invest' : 
                              'bg-expense-light text-expense'
                            }`}>
                              {inv.status === 'accepted' ? '✓ Aktif' : inv.status === 'pending' ? '⏳ Menunggu' : '✗ Ditolak'}
                            </span>
                            <span className="text-[9px] font-bold text-muted2 flex items-center gap-0.5">
                              {inv.role === 'editor' ? <><Edit3 size={10} /> Editor</> : <><Eye size={10} /> Viewer</>}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleRemove(inv.id)} disabled={busy} className="w-8 h-8 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AKUN YANG SAYA AKSES */}
            {acceptedIncoming.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Akun yang Saya Akses</p>
                <div className="space-y-2">
                  {acceptedIncoming.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-bg border border-border2 rounded-xl p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {inv.owner_email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text truncate">{inv.owner_email}</p>
                          <span className="text-[9px] font-bold text-muted2 flex items-center gap-0.5 mt-0.5">
                            {inv.role === 'editor' ? <><Edit3 size={10} /> Bisa edit</> : <><Eye size={10} /> Hanya lihat</>}
                          </span>
                        </div>
                      </div>
                      <Shield size={16} className="text-indigo-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
