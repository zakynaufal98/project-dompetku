import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Check } from 'lucide-react'

// 20 pilihan avatar emoji + warna tema
const AVATAR_OPTIONS = [
  { id: 'cat',    emoji: '🐱', bg: '#8B5CF6' },
  { id: 'dog',    emoji: '🐶', bg: '#F59E0B' },
  { id: 'fox',    emoji: '🦊', bg: '#EF4444' },
  { id: 'bear',   emoji: '🐻', bg: '#92400E' },
  { id: 'panda',  emoji: '🐼', bg: '#1F2937' },
  { id: 'koala',  emoji: '🐨', bg: '#6B7280' },
  { id: 'lion',   emoji: '🦁', bg: '#D97706' },
  { id: 'tiger',  emoji: '🐯', bg: '#EA580C' },
  { id: 'bunny',  emoji: '🐰', bg: '#EC4899' },
  { id: 'frog',   emoji: '🐸', bg: '#16A34A' },
  { id: 'monkey', emoji: '🐵', bg: '#B45309' },
  { id: 'penguin',emoji: '🐧', bg: '#0284C7' },
  { id: 'owl',    emoji: '🦉', bg: '#7C3AED' },
  { id: 'dino',   emoji: '🦕', bg: '#059669' },
  { id: 'dragon', emoji: '🐲', bg: '#DC2626' },
  { id: 'unicorn',emoji: '🦄', bg: '#DB2777' },
  { id: 'robot',  emoji: '🤖', bg: '#4F46E5' },
  { id: 'alien',  emoji: '👾', bg: '#7C3AED' },
  { id: 'ninja',  emoji: '🥷', bg: '#111827' },
  { id: 'cowboy', emoji: '🤠', bg: '#92400E' },
]

export default function ProfileModal({ onClose }) {
  const { user, updateProfile, updatePassword } = useAuth()

  // Prioritas: full_name (user edit) → name (Google OAuth) → email prefix
  const displayName   = user?.user_metadata?.full_name
                     || user?.user_metadata?.name
                     || user?.email?.split('@')[0]
                     || 'Pengguna'
  const currentAvatar = user?.user_metadata?.avatar || null

  const [tab, setTab] = useState('profil')

  // Profil state
  const [name, setName]             = useState(displayName)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileBusy, setProfileBusy] = useState(false)

  // Password state
  const [newPass, setNewPass]       = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passMsg, setPassMsg]       = useState(null)
  const [passBusy, setPassBusy]     = useState(false)

  const activeAvatarObj = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)

  // Fallback inisial jika belum pilih avatar
  const initials    = displayName.slice(0, 2).toUpperCase()
  const INIT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']
  const initColor   = INIT_COLORS[initials.charCodeAt(0) % INIT_COLORS.length]

  const handleSaveProfile = async () => {
    if (!name.trim()) return
    setProfileBusy(true); setProfileMsg(null)

    const err = await updateProfile({
      name: name.trim(),
      avatar: selectedAvatar  // null = hapus avatar (pakai inisial)
    })

    setProfileBusy(false)
    setProfileMsg(err
      ? { type: 'error', text: err.message || 'Gagal menyimpan. Coba lagi.' }
      : { type: 'success', text: 'Profil berhasil diperbarui!' }
    )
  }

  const handleSavePassword = async () => {
    if (newPass.length < 6) { setPassMsg({ type: 'error', text: 'Password minimal 6 karakter.' }); return }
    if (newPass !== confirmPass) { setPassMsg({ type: 'error', text: 'Konfirmasi tidak cocok.' }); return }
    setPassBusy(true); setPassMsg(null)
    const err = await updatePassword(newPass)
    setPassBusy(false)
    if (err) {
      setPassMsg({ type: 'error', text: err.message || 'Gagal mengubah password.' })
    } else {
      setPassMsg({ type: 'success', text: 'Password berhasil diubah!' })
      setNewPass(''); setConfirmPass('')
    }
  }

  const isDirty = name.trim() !== displayName || selectedAvatar !== currentAvatar

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-lg text-text">Pengaturan Akun</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-muted hover:text-text hover:bg-bg transition-colors" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center pt-5 pb-3 flex-shrink-0">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-2 transition-all"
            style={{ backgroundColor: activeAvatarObj ? activeAvatarObj.bg : initColor }}
            aria-hidden="true"
          >
            {activeAvatarObj ? activeAvatarObj.emoji : (
              <span className="text-white font-black text-xl">{initials}</span>
            )}
          </div>
          <p className="font-bold text-text text-sm">{name || displayName}</p>
          <p className="text-xs text-muted font-medium">{user?.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 bg-bg border border-border rounded-xl p-1 mb-4 flex-shrink-0">
          <button
            onClick={() => setTab('profil')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'profil' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
          >
            Profil
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'password' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
          >
            Password
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {tab === 'profil' ? (
            <>
              {/* Nama */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Nama Tampilan</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setProfileMsg(null) }}
                  className="w-full px-4 py-3 rounded-xl bg-bg border border-border outline-none focus:border-primary text-text text-sm font-medium transition-colors"
                  placeholder="Masukkan nama Anda"
                  maxLength={50}
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-muted text-sm font-medium cursor-not-allowed opacity-60"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Pilih Avatar</label>
                  {selectedAvatar && (
                    <button
                      onClick={() => setSelectedAvatar(null)}
                      className="text-[10px] font-bold text-muted hover:text-expense transition-colors"
                    >
                      Hapus avatar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av.id}
                      onClick={() => { setSelectedAvatar(av.id); setProfileMsg(null) }}
                      title={av.id}
                      className={`relative w-full aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                        selectedAvatar === av.id
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-105'
                          : 'hover:ring-1 hover:ring-border2'
                      }`}
                      style={{ backgroundColor: av.bg }}
                      aria-label={`Avatar ${av.id}`}
                      aria-pressed={selectedAvatar === av.id}
                    >
                      {av.emoji}
                      {selectedAvatar === av.id && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check size={10} strokeWidth={3} className="text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {profileMsg && (
                <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl ${
                  profileMsg.type === 'success' ? 'bg-income-light text-income' : 'bg-expense-light text-expense'
                }`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {profileMsg.text}
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={profileBusy || !isDirty}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {profileBusy && <Loader2 size={16} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setPassMsg(null) }}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-bg border border-border outline-none focus:border-primary text-text text-sm font-medium transition-colors"
                    placeholder="Minimal 6 karakter"
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setPassMsg(null) }}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-bg border border-border outline-none focus:border-primary text-text text-sm font-medium transition-colors"
                    placeholder="Ulangi password baru"
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passMsg && (
                <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-xl ${
                  passMsg.type === 'success' ? 'bg-income-light text-income' : 'bg-expense-light text-expense'
                }`}>
                  {passMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {passMsg.text}
                </div>
              )}

              <button
                onClick={handleSavePassword}
                disabled={passBusy || !newPass || !confirmPass}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {passBusy && <Loader2 size={16} className="animate-spin" />}
                Ubah Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
