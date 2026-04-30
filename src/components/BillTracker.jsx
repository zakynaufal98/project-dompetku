import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { fmtShort } from '../lib/utils'
import { BellRing, Plus, Calendar, CheckCircle2, Circle, Trash2, X, Save, Wallet } from 'lucide-react'

export default function BillTracker() {
  // 👇 PERBAIKAN: Panggil walletData dari context
  const { billData, addBill, toggleBill, deleteBill, walletData } = useData()
  const [showForm, setShowForm] = useState(false)
  
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  // 👇 PERBAIKAN: State untuk menyimpan pilihan dompet pembayaran
  const [payWalletId, setPayWalletId] = useState('')

  // Auto-select dompet pertama saat halaman dimuat
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

  const pendingBills = billData.filter(b => {
    if (b.is_lunas) return false;
    const billDate = new Date(b.jatuh_tempo);
    const now = new Date();
    return (billDate.getFullYear() < now.getFullYear()) || 
           (billDate.getFullYear() === now.getFullYear() && billDate.getMonth() <= now.getMonth());
  })

  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0)

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

      {/* 👇 PERBAIKAN: Pemilih Dompet untuk Pembayaran (Mencegah Saldo Bocor) 👇 */}
      {pendingBills.length > 0 && !showForm && (
        <div className="mb-4 flex items-center justify-between bg-bg border border-border2 rounded-xl p-2 px-3">
          <span className="text-[11px] font-bold text-muted2 flex items-center gap-1.5 uppercase tracking-wider">
            <Wallet size={12} /> Bayar Pakai:
          </span>
          <select
            className="bg-transparent text-xs font-bold text-text cursor-pointer outline-none text-right appearance-none"
            value={payWalletId}
            onChange={(e) => setPayWalletId(e.target.value)}
          >
            {walletData?.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
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
            const isLunas = bill.is_lunas;
            const d = new Date(bill.jatuh_tempo);
            const dateStr = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;

            return (
              <div key={bill.id} className="group flex items-center justify-between p-3.5 rounded-2xl border transition-all bg-surface border-border hover:border-income/30 hover:shadow-sm">
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <button 
                    // 👇 PERBAIKAN: Kirim ID Dompet yang dipilih saat klik lunas
                    onClick={() => toggleBill(bill.id, isLunas, payWalletId)} 
                    className="flex-shrink-0 transition-colors text-muted2 hover:text-income active:scale-90"
                  >
                    <Circle size={22} strokeWidth={2.5} />
                  </button>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate text-text-2">
                      {bill.nama_tagihan}
                    </p>
                    <p className="text-[10px] font-bold text-muted2 flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                      <Calendar size={12} /> {dateStr}
                    </p>
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
    </div>
  )
}