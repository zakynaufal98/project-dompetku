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

  const [payWalletId, setPayWalletId] = useState('')

  useEffect(() => {
    if (walletData && walletData.length > 0 && !payWalletId) {
      setPayWalletId(walletData[0].id)
    }
  }, [walletData, payWalletId])

  const handleAdd = async () => {
    if (!name || !amount || !date) return
    setBusy(true)
    await addBill({ 
      nama_tagihan: name, 
      amount: parseInt(amount.replace(/\D/g, '')), 
      jatuh_tempo: date 
    })
    setName(''); setAmount(''); setDate(''); setShowForm(false)
    setBusy(false)
  }

  const handlePay = async () => {
    if (!showPayModal || !payWalletId) return
    setBusy(true)
    await toggleBill(showPayModal.id, false, payWalletId)
    setBusy(false)
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
          <div className="w-10 h-10 rounded-xl bg-income-light text-income flex items-center justify-center transition-colors">
            <BellRing size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-bold text-text tracking-tight">Tagihan Bulanan</h2>
            <p className="text-xs font-medium text-muted mt-0.5">
              {pendingBills.length} tagihan ({fmtShort(totalPending)})
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
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
            <p className="text-[11px] font-bold text-muted mt-1 truncate">Total: {fmtShort(totalPending)}</p>
          </div>
        </div>
      )}

      {/* FORM TAMBAH TAGIHAN */}
      {showForm && (
        <div className="bg-bg/50 rounded-2xl p-4 mb-5 border border-border animate-fade-up">
          <div className="space-y-3 mb-4">
            <input 
              type="text" placeholder="Nama Tagihan (Mis: Netflix)" 
              value={name} onChange={e => setName(e.target.value)}
              className="form-input rounded-xl"
            />
            <div className="flex gap-3">
              <input 
                type="text" placeholder="Nominal (Rp)" 
                value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-1/2 form-input rounded-xl tabular-nums"
              />
              <input 
                type="date" 
                value={date} onChange={e => setDate(e.target.value)}
                className="w-1/2 form-input rounded-xl cursor-pointer"
              />
            </div>
          </div>
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
                    className={`flex-shrink-0 transition-all active:scale-90 w-9 h-9 rounded-xl flex items-center justify-center ${
                      status === 'overdue' ? 'bg-expense-light text-expense hover:bg-expense hover:text-white' :
                      'bg-income-light text-income hover:bg-income hover:text-white'
                    }`}
                    title="Bayar tagihan ini"
                  >
                    <CreditCard size={16} strokeWidth={2.5} />
                  </button>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate text-text-2">
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
                    onClick={() => deleteBill(bill.id)} 
                    className="w-8 h-8 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL BAYAR TAGIHAN */}
      {showPayModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setShowPayModal(null) }}
        >
          <div className="bg-surface rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up cursor-default">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <CreditCard size={20} className="text-income" /> Bayar Tagihan
              </h3>
              <button onClick={() => !busy && setShowPayModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted2 hover:bg-border hover:text-text-2 transition-colors">
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
                        <p className="text-sm font-bold text-text truncate">{w.name}</p>
                        <p className="text-[11px] font-bold text-muted tabular-nums">{fmt(bal)}</p>
                      </div>
                      {payWalletId === w.id && <CheckCircle2 size={18} className="text-income flex-shrink-0" />}
                      {isInsufficient && <span className="text-[9px] font-bold text-expense flex-shrink-0">Kurang</span>}
                    </label>
                  )
                })}
              </div>
            </div>

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