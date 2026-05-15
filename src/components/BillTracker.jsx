import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'
import { fmtShort, fmt } from '../lib/utils'
import { BankLogo } from './UI'
import { BellRing, Plus, Calendar, CheckCircle2, Trash2, X, Save, Wallet, AlertTriangle, CreditCard, ChevronDown } from 'lucide-react'

export default function BillTracker() {
  const { billData, addBill, toggleBill, deleteBill, walletData, totals } = useData()
  const [showForm, setShowForm] = useState(false)
  const [showPayModal, setShowPayModal] = useState(null) // bill object or null
  
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const [payWalletId, setPayWalletId] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (walletData && walletData.length > 0 && !payWalletId) {
      setPayWalletId(walletData[0].id)
    }
  }, [walletData, payWalletId])

  useEffect(() => {
    if (!showPayModal && !deleteConfirm) return
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' || busy) return
      setShowPayModal(null)
      setDeleteConfirm(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPayModal, deleteConfirm, busy])

  const handleAdd = async () => {
    if (!name || !amount || !date) return
    setBusy(true)
    setActionError('')
    const error = await addBill({ 
      nama_tagihan: name, 
      amount: parseInt(amount.replace(/\D/g, '')), 
      jatuh_tempo: date 
    })
    if (!error) {
      setName(''); setAmount(''); setDate(''); setShowForm(false)
    } else {
      setActionError(error.message || 'Gagal menyimpan tagihan.')
    }
    setBusy(false)
  }

  const handlePay = async () => {
    if (!showPayModal || !payWalletId) return
    setBusy(true)
    setActionError('')
    const error = await toggleBill(showPayModal.id, false, payWalletId)
    setBusy(false)
    if (error) {
      setActionError(error.message || 'Gagal membayar tagihan.')
      return
    }
    setShowPayModal(null)
  }

  const pendingBills = billData.filter(b => {
    if (b.is_lunas) return false;
    const billDate = new Date(b.jatuh_tempo);
    const now = new Date();
    return (billDate.getFullYear() < now.getFullYear()) || 
           (billDate.getFullYear() === now.getFullYear() && billDate.getMonth() <= now.getMonth());
  })

  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0)

  // Hitung status overdue
  const now = new Date()
  const getBillStatus = (bill) => {
    const d = new Date(bill.jatuh_tempo)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const billDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (billDay < today) return 'overdue'
    const diffDays = Math.ceil((billDay - today) / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return 'soon'
    return 'normal'
  }

  const selectedWalletBalance = totals?.walletBalances?.find(w => w.id === payWalletId)?.calculatedBalance || 0

  return (
    <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm flex flex-col h-full transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
            <BellRing size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.15em] mb-0.5">Kewajiban</p>
            <h2 className="font-black text-base text-text tracking-tight">Tagihan Bulanan</h2>
          </div>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          aria-label={showForm ? 'Tutup form tambah tagihan' : 'Tambah tagihan'}
          aria-expanded={showForm}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
            showForm ? 'bg-expense-light text-expense border border-expense/20' : 'bg-bg text-text-2 border border-border2 hover:border-border'
          }`}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* PROGRESS RING */}
      {pendingBills.length > 0 && !showForm && (
        <div className="mb-4 bg-bg border border-border2 rounded-2xl p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--color-border))" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--color-income))" strokeWidth="3" strokeDasharray={`${(pendingBills.filter(b => getBillStatus(b) !== 'overdue').length / pendingBills.length) * 94.2} 94.2`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-text">{pendingBills.length}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {pendingBills.filter(b => getBillStatus(b) === 'overdue').length > 0 && (
                <span className="text-[10px] font-bold text-expense bg-expense-light px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle size={10} /> {pendingBills.filter(b => getBillStatus(b) === 'overdue').length} Overdue
                </span>
              )}
              {pendingBills.filter(b => getBillStatus(b) === 'soon').length > 0 && (
                <span className="text-[10px] font-bold text-invest bg-invest-light px-2 py-0.5 rounded">
                  {pendingBills.filter(b => getBillStatus(b) === 'soon').length} Segera
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-muted mt-1">Total: {fmtShort(totalPending)}</p>
          </div>
        </div>
      )}

      {/* FORM TAMBAH TAGIHAN */}
      {showForm && (
        <div className="bg-bg/50 rounded-2xl p-4 mb-5 border border-border animate-fade-up">
          <div className="space-y-3 mb-4">
            <label htmlFor="bill-name" className="sr-only">Nama tagihan</label>
            <input 
              id="bill-name"
              type="text" placeholder="Nama Tagihan (Mis: Netflix)" 
              value={name} onChange={e => setName(e.target.value)}
              className="form-input rounded-xl"
            />
            <div className="flex gap-3">
              <label htmlFor="bill-amount" className="sr-only">Nominal tagihan</label>
              <input 
                id="bill-amount"
                type="text" placeholder="Nominal (Rp)" 
                value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-1/2 form-input rounded-xl tabular-nums"
              />
              <label htmlFor="bill-date" className="sr-only">Tanggal jatuh tempo</label>
              <input 
                id="bill-date"
                type="date" 
                value={date} onChange={e => setDate(e.target.value)}
                className="w-1/2 form-input rounded-xl cursor-pointer"
              />
            </div>
          </div>
          {actionError && (
            <div className="mb-3 text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">
              {actionError}
            </div>
          )}
          <button 
            onClick={handleAdd}
            disabled={busy || !name || !amount || !date}
            className="btn-income w-full py-3 shadow-lg shadow-income/20"
          >
            <Save size={16} />
            {busy ? 'Menyimpan...' : 'Simpan Tagihan'}
          </button>
        </div>
      )}

      {/* DAFTAR TAGIHAN */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar max-h-[350px]">
        {pendingBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted2 opacity-60">
            <CheckCircle2 size={40} className="mb-3 text-invest" />
            <p className="text-sm font-bold tracking-tight text-center">Hore! Semua tagihan beres 🎉</p>
          </div>
        ) : (
          pendingBills.map(bill => {
            const status = getBillStatus(bill)
            const d = new Date(bill.jatuh_tempo);
            const dateStr = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;

            return (
              <div key={bill.id} className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all bg-surface hover:shadow-sm ${
                status === 'overdue' ? 'border-expense/30 hover:border-expense/50' :
                status === 'soon' ? 'border-invest/30 hover:border-invest/50' :
                'border-border hover:border-income/30'
              }`}>
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <button 
                    onClick={() => setShowPayModal(bill)} 
                    aria-label={`Bayar tagihan ${bill.nama_tagihan}`}
                    className={`flex-shrink-0 transition-all active:scale-90 w-10 h-10 rounded-xl flex items-center justify-center ${
                      status === 'overdue' ? 'bg-expense-light text-expense hover:bg-expense hover:text-white' :
                      'bg-income-light text-income hover:bg-income hover:text-white'
                    }`}
                    title="Bayar tagihan ini"
                  >
                    <CreditCard size={16} strokeWidth={2.5} />
                  </button>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold line-clamp-2 text-text-2">
                      {bill.nama_tagihan}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide ${
                        status === 'overdue' ? 'text-expense' : status === 'soon' ? 'text-invest' : 'text-muted2'
                      }`}>
                        <Calendar size={10} /> {dateStr}
                      </span>
                      {status === 'overdue' && (
                        <span className="text-[9px] font-black text-expense bg-expense-light px-1.5 py-0.5 rounded uppercase">Overdue</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3">
                  <span className="text-sm font-black tabular-nums text-text-2">
                    {fmtShort(bill.amount)}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(bill)}
                    aria-label={`Hapus tagihan ${bill.nama_tagihan}`}
                    className="w-9 h-9 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 cursor-pointer animate-fade-in"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-bill-title"
        >
          <div className="bg-surface rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default max-h-[calc(100dvh-1rem)] overflow-y-auto"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 id="delete-bill-title" className="font-bold text-lg text-text flex items-center gap-2">
                <Trash2 size={20} className="text-expense" /> Hapus Tagihan
              </h3>
              <button onClick={() => setDeleteConfirm(null)} aria-label="Tutup dialog hapus tagihan" className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="bg-expense-light border border-expense/20 rounded-2xl p-4 mb-5">
              <p className="text-sm font-bold text-text">{deleteConfirm.nama_tagihan}</p>
              <p className="text-lg font-black text-expense tabular-nums mt-1">{fmtShort(deleteConfirm.amount)}</p>
            </div>

            <p className="text-sm text-muted text-center mb-5">Yakin ingin menghapus tagihan ini? Tindakan ini tidak bisa dibatalkan.</p>

            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-border text-text-2 text-sm font-bold rounded-xl hover:bg-border2 transition-colors">Batal</button>
              <button
                onClick={async () => {
                  setBusy(true)
                  setActionError('')
                  const error = await deleteBill(deleteConfirm.id)
                  setBusy(false)
                  if (error) {
                    setActionError(error.message || 'Gagal menghapus tagihan.')
                    return
                  }
                  setDeleteConfirm(null)
                }}
                disabled={busy}
                className="flex-1 py-3 bg-expense text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> {busy ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL BAYAR TAGIHAN */}
      {showPayModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 cursor-pointer animate-fade-in"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setShowPayModal(null) }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-bill-title"
        >
          <div className="bg-surface rounded-t-[24px] sm:rounded-[24px] p-5 sm:p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default max-h-[calc(100dvh-1rem)] overflow-y-auto"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 id="pay-bill-title" className="font-bold text-lg text-text flex items-center gap-2">
                <CreditCard size={20} className="text-income" /> Bayar Tagihan
              </h3>
              <button onClick={() => !busy && setShowPayModal(null)} aria-label="Tutup dialog bayar tagihan" className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Bill Info Card */}
            <div className="bg-bg border border-border2 rounded-2xl p-5 mb-5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Tagihan</p>
              <p className="text-lg font-black text-text">{showPayModal.nama_tagihan}</p>
              <p className="text-2xl font-black text-expense mt-2 tabular-nums">{fmt(Number(showPayModal.amount))}</p>
              <p className="text-[11px] font-bold text-muted2 mt-1 flex items-center gap-1">
                <Calendar size={12} /> Jatuh tempo: {new Date(showPayModal.jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Wallet Selection */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-muted mb-2">Bayar dari Dompet</label>
              <div className="space-y-2">
                {walletData?.map(w => {
                  const wb = totals?.walletBalances?.find(wb => wb.id === w.id)
                  const bal = wb?.calculatedBalance || 0
                  const isInsufficient = bal < Number(showPayModal.amount)
                  return (
                    <label 
                      key={w.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        payWalletId === w.id 
                          ? 'border-income bg-income-light' 
                          : 'border-border hover:border-income/30'
                      } ${isInsufficient ? 'opacity-50' : ''}`}
                    >
                      <input type="radio" name="payWallet" value={w.id} checked={payWalletId === w.id} onChange={() => setPayWalletId(w.id)} className="hidden" />
                      <BankLogo name={w.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text line-clamp-2">{w.name}</p>
                        <p className="text-[11px] font-bold text-muted tabular-nums">{fmt(bal)}</p>
                      </div>
                      {payWalletId === w.id && <CheckCircle2 size={18} className="text-income flex-shrink-0" />}
                      {isInsufficient && <span className="text-[9px] font-bold text-expense flex-shrink-0">Kurang</span>}
                    </label>
                  )
                })}
              </div>
            </div>

            {actionError && (
              <div className="mb-4 text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">
                {actionError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button onClick={() => setShowPayModal(null)} disabled={busy} className="flex-1 py-3 bg-border text-text-2 text-sm font-bold rounded-xl hover:bg-border transition-colors">Batal</button>
              <button 
                onClick={handlePay} 
                disabled={busy || selectedWalletBalance < Number(showPayModal.amount)}
                className="flex-1 py-3 bg-income text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {busy ? 'Memproses...' : <><CreditCard size={16} /> Bayar Sekarang</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
