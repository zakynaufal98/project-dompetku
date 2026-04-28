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
  const [tfDate, setTfDate] = useState(new Date().toISOString().split('T')[0])

  // --- LOGIKA VALIDASI REAL-TIME ---
  // Cari data dompet asal yang sedang dipilih
  const selectedFromWallet = totals?.walletBalances?.find(w => w.id === tfFrom);
  
  // Cek apakah jumlah yang diketik MELEBIHI saldo dompet asal
  const isExceedsBalance = selectedFromWallet && (Number(tfAmount) > selectedFromWallet.calculatedBalance);

  const handleOpenNew = () => {
    setEditId(null); setName(''); setBalance(''); setColor('#4F46E5'); 
    setShowConfirmDelete(false); setShowModal(true); setErr('');
  }

  const handleOpenEdit = (w) => {
    setEditId(w.id); setName(w.name); setBalance(w.balance || 0); setColor(w.color || '#4F46E5'); 
    setShowConfirmDelete(false); setShowModal(true); setErr('');
  }

  const handleOpenTransfer = () => {
    setTfFrom(''); setTfTo(''); setTfAmount(''); setTfDesc(''); setErr('');
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
      descOut: `Transfer ke ${tujuan.name}${customDesc}`,
      descIn: `Transfer dari ${asal.name}${customDesc}`,
      date: tfDate
    });

    setBusy(false);
    if (error) setErr('Gagal melakukan transfer');
    else setShowTransfer(false);
  }

  const COLORS = ['#4F46E5', '#10B981', '#FF8A00', '#E11D48', '#06B6D4', '#8B5CF6', '#1E293B', '#F43F5E'];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Dompet & Rekening</h2>
        
        {totals?.walletBalances?.length > 1 && (
          <button onClick={handleOpenTransfer} className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <ArrowRightLeft size={16} strokeWidth={2.5} /> Transfer Saldo
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-stretch">
        {totals?.walletBalances?.map(w => (
          <div 
            key={w.id} 
            onClick={() => handleOpenEdit(w)}
            className="min-w-[180px] p-5 rounded-[20px] bg-white border border-slate-200 shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: w.color || '#ccc' }} />
            <div>
              <div className="flex items-center gap-2 mb-2 mt-1">
                <BankLogo name={w.name} size="sm" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{w.name}</p>
              </div>
              <h3 className="text-xl font-black text-slate-800 tabular-nums">{fmt(w.calculatedBalance)}</h3>
            </div>
            <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
          </div>
        ))}

        <button 
          onClick={handleOpenNew}
          className="min-w-[140px] p-5 rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex-shrink-0"
        >
          <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-inherit">
            <Plus size={16} strokeWidth={3} />
          </span>
          <span className="text-xs font-bold">Tambah Baru</span>
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
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default relative">
            
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-indigo-600" /> Transfer Saldo
              </h3>
              <button 
                onClick={() => !busy && setShowTransfer(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Dari Dompet</label>
                <select value={tfFrom} onChange={e => setTfFrom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-medium">
                  <option value="" disabled>Pilih Sumber...</option>
                  {totals.walletBalances.map(w => <option key={`from-${w.id}`} value={w.id}>{w.name} (Rp {w.calculatedBalance.toLocaleString('id-ID')})</option>)}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10 pointer-events-none">
                <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 border-4 border-white"><ArrowRightLeft size={16} className="rotate-90" /></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Ke Dompet</label>
                <select value={tfTo} onChange={e => setTfTo(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-medium">
                  <option value="" disabled>Pilih Tujuan...</option>
                  {totals.walletBalances.map(w => <option key={`to-${w.id}`} value={w.id} disabled={w.id === tfFrom}>{w.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Jumlah Transfer (Rp)</label>
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
                      ? 'border-rose-500 bg-rose-50 text-rose-700 focus:border-rose-600' 
                      : 'border-slate-200 focus:border-indigo-500'
                  }`} 
                  placeholder="0" 
                />
                {/* PESAN ERROR REAL-TIME MUNCUL DI SINI */}
                {isExceedsBalance && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1.5">
                    Saldo tidak cukup! Maksimal transfer: Rp {selectedFromWallet.calculatedBalance.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal</label>
                <input type="date" value={tfDate} onChange={e => setTfDate(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Catatan (Opsional)</label>
                <input type="text" value={tfDesc} onChange={e => setTfDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="Mis: Pindah tabungan..." />
              </div>

              {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-4 py-3 font-medium">{err}</div>}

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button onClick={() => setShowTransfer(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
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
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default relative">
            {showConfirmDelete ? (
              <div className="animate-fade-in text-center py-2">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} strokeWidth={2.5} /></div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Hapus Dompet Ini?</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">Transaksi yang sudah tercatat menggunakan dompet ini <b>tidak akan hilang</b>, namun riwayat dompet pada transaksi tersebut akan dikosongkan.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmDelete(false)} disabled={busy} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                  <button onClick={executeDelete} disabled={busy} className="flex-1 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors">{busy ? 'Menghapus...' : 'Ya, Hapus'}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-slate-800">{editId ? 'Edit Dompet' : 'Tambah Dompet Baru'}</h3>
                  <div className="flex items-center gap-1.5">
                    {editId && (
                      <button onClick={() => setShowConfirmDelete(true)} className="w-8 h-8 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-colors" title="Hapus Dompet"><Trash2 size={16} strokeWidth={2.5} /></button>
                    )}
                    <button onClick={() => !busy && setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Tutup">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Dompet (Mis: BCA, Kas, OVO)</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="Masukkan nama..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Saldo Awal (Rp)</label>
                    <input type="text" inputMode="numeric" value={balance ? Number(balance).toLocaleString('id-ID') : ''} onChange={e => setBalance(e.target.value.replace(/\D/g, ''))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none tabular-nums" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Warna Kartu</label>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}
                    </div>
                  </div>
                  {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-4 py-3 font-medium">{err}</div>}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
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