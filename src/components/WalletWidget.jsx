import { useState } from 'react'
import { createPortal } from 'react-dom' 
import { useData } from '../context/DataContext'
import { fmt } from '../lib/utils'
import { BankLogo } from './UI' 
import { Plus, Trash2, ArrowRightLeft, X } from 'lucide-react'

export default function WalletWidget({ totals, addWallet, updateWallet, deleteWallet }) {
  const { transferWallet } = useData(); 

  const [showModal, setShowModal] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false) 
  const [showConfirmDelete, setShowConfirmDelete] = useState(false) 
  const [editId, setEditId] = useState(null) 
  
  // State form Dompet
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#4F46E5') 
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // State form Transfer
  const [tfFrom, setTfFrom] = useState('')
  const [tfTo, setTfTo] = useState('')
  const [tfAmount, setTfAmount] = useState('')
  const [tfDesc, setTfDesc] = useState('')
  const [tfFeeType, setTfFeeType] = useState('none')
  const [tfDate, setTfDate] = useState(new Date().toISOString().split('T')[0])

  // --- LOGIKA VALIDASI REAL-TIME ---
  // Cari data dompet asal yang sedang dipilih
  const selectedFromWallet = totals?.walletBalances?.find(w => w.id === tfFrom);
  
  const feeAmount = tfFeeType === 'bifast' ? 2500 : tfFeeType === 'biasa' ? 6500 : 0;
  
  // Cek apakah jumlah yang diketik MELEBIHI saldo dompet asal
  const isExceedsBalance = selectedFromWallet && (Number(tfAmount) + feeAmount > selectedFromWallet.calculatedBalance);

  const handleOpenNew = () => {
    setEditId(null); setName(''); setBalance(''); setColor('#4F46E5'); 
    setShowConfirmDelete(false); setShowModal(true); setErr('');
  }

  const handleOpenEdit = (w) => {
    setEditId(w.id); setName(w.name); setBalance(w.balance || 0); setColor(w.color || '#4F46E5'); 
    setShowConfirmDelete(false); setShowModal(true); setErr('');
  }

  const handleOpenTransfer = () => {
    setTfFrom(''); setTfTo(''); setTfAmount(''); setTfDesc(''); setTfFeeType('none'); setErr('');
    setShowTransfer(true);
  }

  const handleSaveWallet = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const payload = { name: name.trim(), balance: balance ? Number(balance) : 0, color };
    if (editId) await updateWallet(editId, payload);
    else await addWallet(payload);
    setBusy(false); setShowModal(false);
  }

  const executeDelete = async () => {
    setBusy(true); await deleteWallet(editId);
    setBusy(false); setShowConfirmDelete(false); setShowModal(false);
  }

  const handleTransfer = async () => {
    if (!tfFrom || !tfTo) { setErr('Pilih dompet asal dan tujuan'); return; }
    if (tfFrom === tfTo) { setErr('Dompet asal dan tujuan tidak boleh sama'); return; }
    if (!tfAmount || +tfAmount <= 0) { setErr('Jumlah transfer tidak valid'); return; }
    if (isExceedsBalance) { setErr('Saldo dompet asal tidak mencukupi'); return; } // Dobel proteksi keamanan

    setBusy(true); setErr('');
    const customDesc = tfDesc.trim() ? ` - ${tfDesc.trim()}` : '';
    
    const asal = totals.walletBalances.find(w => w.id === tfFrom);
    const tujuan = totals.walletBalances.find(w => w.id === tfTo);

    const error = await transferWallet({
      fromId: tfFrom,
      toId: tfTo,
      amount: +tfAmount,
      fee: feeAmount,
      descOut: `Transfer ke ${tujuan.name}${customDesc}`,
      descIn: `Transfer dari ${asal.name}${customDesc}`,
      date: tfDate
    });

    setBusy(false);
    if (error) setErr('Gagal melakukan transfer');
    else setShowTransfer(false);
  }

  // 🏦 WARNA BANK REAL INDONESIA — Disesuaikan dengan identitas brand masing-masing bank/e-wallet
  const BANK_COLORS = [
    { key: 'bca',       keywords: ['bca', 'klikbca', 'blu'],             color: '#003D79', label: 'BCA' },
    { key: 'bri',       keywords: ['bri', 'brimo'],                       color: '#00529C', label: 'BRI' },
    { key: 'bni',       keywords: ['bni'],                                color: '#F26522', label: 'BNI' },
    { key: 'mandiri',   keywords: ['mandiri', 'livin'],                   color: '#003580', label: 'Mandiri' },
    { key: 'bsi',       keywords: ['bsi', 'syariah'],                     color: '#00A34E', label: 'BSI' },
    { key: 'cimb',      keywords: ['cimb', 'niaga', 'octo'],              color: '#7B1B2D', label: 'CIMB' },
    { key: 'permata',   keywords: ['permata', 'permatabank'],             color: '#005BAC', label: 'Permata' },
    { key: 'danamon',   keywords: ['danamon'],                            color: '#003E7E', label: 'Danamon' },
    { key: 'ocbc',      keywords: ['ocbc', 'nyala'],                      color: '#D8232A', label: 'OCBC' },
    { key: 'jenius',    keywords: ['jenius', 'btpn'],                     color: '#00B5E2', label: 'Jenius' },
    { key: 'jago',      keywords: ['jago'],                               color: '#FF6B35', label: 'Jago' },
    { key: 'gopay',     keywords: ['gopay', 'gojek'],                     color: '#00AED6', label: 'GoPay' },
    { key: 'ovo',       keywords: ['ovo'],                                color: '#4C2A86', label: 'OVO' },
    { key: 'dana',      keywords: ['dana'],                               color: '#108EE9', label: 'DANA' },
    { key: 'shopeepay', keywords: ['shopee', 'shopeepay', 'spay'],        color: '#EE4D2D', label: 'ShopeePay' },
    { key: 'linkaja',   keywords: ['linkaja', 'link aja'],                color: '#E2231B', label: 'LinkAja' },
    { key: 'seabank',   keywords: ['seabank', 'sea bank'],                color: '#FF6600', label: 'SeaBank' },
    { key: 'cash',      keywords: ['tunai', 'cash', 'kas', 'dompet'],     color: '#16A34A', label: 'Tunai' },
  ]

  // Fallback warna jika nama dompet tidak cocok dengan bank manapun
  const GENERIC_COLORS = ['#4F46E5', '#6366f1', '#8B5CF6', '#1E293B']

  // Semua warna yang tampil di color picker
  const ALL_PICKER_COLORS = [...BANK_COLORS.map(b => b.color), ...GENERIC_COLORS]

  // Auto-detect warna berdasarkan nama dompet
  const detectBankColor = (walletName) => {
    const lower = walletName.toLowerCase()
    for (const bank of BANK_COLORS) {
      if (bank.keywords.some(kw => lower.includes(kw))) return bank.color
    }
    return null
  }

  // Helper: update nama + auto-suggest warna
  const handleNameChange = (newName) => {
    setName(newName)
    const detected = detectBankColor(newName)
    if (detected) setColor(detected)
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Aset</p>
          <h2 className="font-black text-base text-text tracking-tight">Dompet & Rekening</h2>
        </div>
        {totals?.walletBalances?.length > 1 && (
          <button onClick={handleOpenTransfer} className="text-sm font-bold text-muted bg-bg border border-border hover:text-text hover:border-border2 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <ArrowRightLeft size={15} strokeWidth={2.5} /> Transfer
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
        {totals?.walletBalances?.map(w => {
          const c = w.color || '#4F46E5'
          return (
            <div
              key={w.id}
              onClick={() => handleOpenEdit(w)}
              className="relative flex-shrink-0 w-56 h-[136px] rounded-2xl cursor-pointer overflow-hidden select-none group transition-all duration-200 hover:-translate-y-1"
              style={{
                background: `linear-gradient(140deg, ${c} 0%, ${c}99 100%)`,
                boxShadow: `0 8px 28px ${c}50`,
              }}
            >
              {/* Dekorasi: lingkaran besar kanan atas */}
              <div
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              />
              {/* Dekorasi: lingkaran kecil kiri bawah */}
              <div
                className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.12)' }}
              />
              {/* Grain overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
                <svg width="100%" height="100%">
                  <filter id={`grain-${w.id}`}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter={`url(#grain-${w.id})`} />
                </svg>
              </div>

              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                {/* Baris atas: nama + chip */}
                <div className="flex items-start justify-between">
                  <p className="text-white/75 text-[10px] font-bold uppercase tracking-[0.18em] leading-none">
                    {w.name}
                  </p>
                  {/* Chip kartu */}
                  <div className="w-7 h-5 rounded-[4px] flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <div className="w-full h-full rounded-[3px] grid grid-cols-2 gap-px p-0.5 opacity-60">
                      <div className="bg-white/40 rounded-[1px]" />
                      <div className="bg-white/40 rounded-[1px]" />
                      <div className="bg-white/40 rounded-[1px]" />
                      <div className="bg-white/40 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Baris bawah: saldo + edit */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest mb-1">Saldo</p>
                    <p className="text-white font-black text-[19px] tabular-nums tracking-tight leading-none drop-shadow-sm">
                      {fmt(w.calculatedBalance)}
                    </p>
                  </div>
                  <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Tombol tambah */}
        <button
          onClick={handleOpenNew}
          className="flex-shrink-0 w-36 h-[136px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:-translate-y-1 group"
          style={{ border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-muted group-hover:border-primary/30 group-hover:text-primary transition-colors shadow-sm">
            <Plus size={18} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-muted group-hover:text-text transition-colors">Tambah Dompet</span>
        </button>
      </div>

      {/* MODAL TRANSFER */}
      {showTransfer && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setShowTransfer(false);
            }
          }}
        >
          <div className="bg-surface rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default relative">
            
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-income" /> Transfer Saldo
              </h3>
              <button 
                onClick={() => !busy && setShowTransfer(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Dari Dompet</label>
                <select value={tfFrom} onChange={e => setTfFrom(e.target.value)} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-income outline-none font-medium">
                  <option value="" disabled>Pilih Sumber...</option>
                  {totals.walletBalances.map(w => <option key={`from-${w.id}`} value={w.id}>{w.name} (Rp {w.calculatedBalance.toLocaleString('id-ID')})</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10 pointer-events-none">
                <div className="bg-border p-1.5 rounded-full text-muted2 border-4 border-surface"><ArrowRightLeft size={16} className="rotate-90" /></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Ke Dompet</label>
                <select value={tfTo} onChange={e => setTfTo(e.target.value)} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-income outline-none font-medium">
                  <option value="" disabled>Pilih Tujuan...</option>
                  {totals.walletBalances.map(w => <option key={`to-${w.id}`} value={w.id} disabled={w.id === tfFrom}>{w.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Jumlah Transfer (Rp)</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  value={tfAmount ? Number(tfAmount).toLocaleString('id-ID') : ''} 
                  onChange={e => {
                    setTfAmount(e.target.value.replace(/\D/g, ''));
                    setErr(''); // Hilangkan error global saat user mengetik
                  }} 
                  className={`w-full border rounded-xl px-4 py-3 text-sm outline-none tabular-nums transition-colors ${
                    isExceedsBalance 
                      ? 'border-expense bg-expense-light text-expense focus:border-expense' 
                      : 'border-border bg-field text-text focus:border-income'
                  }`} 
                  placeholder="0" 
                />
                {/* PESAN ERROR REAL-TIME MUNCUL DI SINI */}
                {isExceedsBalance && (
                  <p className="text-[11px] font-bold text-expense mt-1.5">
                    Saldo tidak cukup! Maksimal transfer (termasuk biaya): Rp {selectedFromWallet.calculatedBalance.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Biaya Transfer</label>
                <div className="flex gap-3">
                  <label className={`flex-1 border rounded-xl p-3 cursor-pointer transition-all ${tfFeeType === 'none' ? 'border-income bg-income-light text-income' : 'border-border bg-field text-text hover:border-income/50'}`}>
                    <input type="radio" name="feeType" value="none" checked={tfFeeType === 'none'} onChange={() => setTfFeeType('none')} className="hidden" />
                    <div className="text-center">
                      <div className="text-sm font-bold">Gratis</div>
                      <div className="text-[10px] opacity-80">Rp 0</div>
                    </div>
                  </label>
                  <label className={`flex-1 border rounded-xl p-3 cursor-pointer transition-all ${tfFeeType === 'bifast' ? 'border-income bg-income-light text-income' : 'border-border bg-field text-text hover:border-income/50'}`}>
                    <input type="radio" name="feeType" value="bifast" checked={tfFeeType === 'bifast'} onChange={() => setTfFeeType('bifast')} className="hidden" />
                    <div className="text-center">
                      <div className="text-sm font-bold">BI Fast</div>
                      <div className="text-[10px] opacity-80">Rp 2.500</div>
                    </div>
                  </label>
                  <label className={`flex-1 border rounded-xl p-3 cursor-pointer transition-all ${tfFeeType === 'biasa' ? 'border-income bg-income-light text-income' : 'border-border bg-field text-text hover:border-income/50'}`}>
                    <input type="radio" name="feeType" value="biasa" checked={tfFeeType === 'biasa'} onChange={() => setTfFeeType('biasa')} className="hidden" />
                    <div className="text-center">
                      <div className="text-sm font-bold">Biasa</div>
                      <div className="text-[10px] opacity-80">Rp 6.500</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Tanggal</label>
                <input type="date" value={tfDate} onChange={e => setTfDate(e.target.value)} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text focus:border-income outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Catatan (Opsional)</label>
                <input type="text" value={tfDesc} onChange={e => setTfDesc(e.target.value)} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted2 focus:border-income outline-none" placeholder="Mis: Pindah tabungan..." />
              </div>

              {err && <div className="text-xs text-expense bg-expense-light rounded-xl px-4 py-3 font-medium">{err}</div>}

              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={() => setShowTransfer(false)} className="flex-1 py-3 bg-border text-text-2 text-sm font-bold rounded-xl hover:bg-border transition-colors">Batal</button>
                {/* TOMBOL TRANSFER OTOMATIS MATI JIKA SALDO KURANG */}
                <button 
                  onClick={handleTransfer} 
                  disabled={busy || !tfFrom || !tfTo || !tfAmount || isExceedsBalance} 
                  className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? 'Memproses...' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL TAMBAH/EDIT DOMPET TETAP SAMA */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-surface rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default relative">
            {showConfirmDelete ? (
              <div className="animate-fade-in text-center py-2">
                <div className="w-16 h-16 bg-rose-100 text-expense rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} strokeWidth={2.5} /></div>
                <h3 className="font-bold text-lg text-text mb-2">Hapus Dompet Ini?</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">Transaksi yang sudah tercatat menggunakan dompet ini <b>tidak akan hilang</b>, namun riwayat dompet pada transaksi tersebut akan dikosongkan.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmDelete(false)} disabled={busy} className="flex-1 py-3 bg-border text-text-2 text-sm font-bold rounded-xl hover:bg-border transition-colors">Batal</button>
                  <button onClick={executeDelete} disabled={busy} className="flex-1 py-3 bg-expense text-white text-sm font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors">{busy ? 'Menghapus...' : 'Ya, Hapus'}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-text">{editId ? 'Edit Dompet' : 'Tambah Dompet Baru'}</h3>
                  <div className="flex items-center gap-1.5">
                    {editId && (
                      <button onClick={() => setShowConfirmDelete(true)} className="w-8 h-8 flex items-center justify-center rounded-full text-expense hover:bg-expense-light transition-colors" title="Hapus Dompet"><Trash2 size={16} strokeWidth={2.5} /></button>
                    )}
                    <button onClick={() => !busy && setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors" title="Tutup">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5">Nama Dompet (Mis: BCA, Kas, OVO)</label>
                    <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted2 focus:border-income outline-none" placeholder="Masukkan nama..." />
                    {/* Auto-detect feedback */}
                    {name && detectBankColor(name) && (
                      <p className="text-[11px] font-bold text-income mt-1.5 flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: detectBankColor(name) }} />
                        Warna otomatis: {BANK_COLORS.find(b => b.keywords.some(kw => name.toLowerCase().includes(kw)))?.label}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5">Saldo Awal (Rp)</label>
                    <input type="text" inputMode="numeric" value={balance ? Number(balance).toLocaleString('id-ID') : ''} onChange={e => setBalance(e.target.value.replace(/\D/g, ''))} className="w-full bg-field border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted2 focus:border-income outline-none tabular-nums" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1.5">Warna Kartu</label>
                    <div className="flex flex-wrap gap-2.5">
                      {ALL_PICKER_COLORS.map(c => {
                        const bankInfo = BANK_COLORS.find(b => b.color === c)
                        return (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`relative w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-text scale-110 shadow-sm ring-2 ring-offset-1 ring-offset-surface' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: c, ringColor: c + '60' }}
                            title={bankInfo?.label || ''}
                          />
                        )
                      })}
                    </div>
                  </div>
                  {err && <div className="text-xs text-expense bg-expense-light rounded-xl px-4 py-3 font-medium">{err}</div>}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-border text-text-2 text-sm font-bold rounded-xl hover:bg-border transition-colors">Batal</button>
                    <button onClick={handleSaveWallet} disabled={busy || !name} className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">{editId ? 'Simpan Perubahan' : 'Simpan Dompet'}</button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>,
        document.body 
      )}
    </div>
  )
}
