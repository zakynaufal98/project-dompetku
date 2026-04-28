import { useState } from 'react'
import { useData } from '../context/DataContext'
import { fmtShort } from '../lib/utils'
import { BellRing, Plus, Calendar, CheckCircle2, Circle, Trash2, X } from 'lucide-react'

export default function BillTracker() {
  const { billData, addBill, toggleBill, deleteBill } = useData()
  const [showForm, setShowForm] = useState(false)
  
  // State untuk form
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')

  const handleAdd = async () => {
    if (!name || !amount || !date) return
    await addBill({ 
      nama_tagihan: name, 
      amount: parseInt(amount.replace(/\D/g, '')), 
      jatuh_tempo: date 
    })
    setName(''); setAmount(''); setDate(''); setShowForm(false)
  }

  // LOGIKA BARU: Filter tagihan belum lunas HANYA untuk bulan ini (atau bulan-bulan sebelumnya yang nunggak)
  const pendingBills = billData.filter(b => {
    if (b.is_lunas) return false; // Sembunyikan yang sudah lunas

    const billDate = new Date(b.jatuh_tempo);
    const now = new Date();
    
    // Cek apakah tagihan ini untuk bulan ini atau bulan lalu (menunggak)
    const isPastOrCurrentMonth = 
      (billDate.getFullYear() < now.getFullYear()) || 
      (billDate.getFullYear() === now.getFullYear() && billDate.getMonth() <= now.getMonth());

    return isPastOrCurrentMonth;
  })

  // Hitung total dari tagihan yang tertampil saja
  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-income-light text-income flex items-center justify-center">
            <BellRing size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-bold text-text tracking-tight">Tagihan Bulanan</h2>
            <p className="text-xs font-medium text-muted mt-0.5">
              {pendingBills.length} tagihan belum dibayar ({fmtShort(totalPending)})
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-bg hover:bg-border text-text-2 rounded-xl transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* FORM TAMBAH TAGIHAN */}
      {showForm && (
        <div className="bg-bg rounded-xl p-4 mb-4 border border-border animate-fade-up">
          <div className="space-y-3 mb-3">
            <input 
              type="text" placeholder="Nama Tagihan (Mis: Netflix)" 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-field border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted2 focus:border-income outline-none"
            />
            <div className="flex gap-3">
              <input 
                type="text" placeholder="Nominal (Rp)" 
                value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-1/2 bg-field border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted2 focus:border-income outline-none"
              />
              <input 
                type="date" 
                value={date} onChange={e => setDate(e.target.value)}
                className="w-1/2 bg-field border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-income outline-none cursor-pointer"
              />
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full bg-income hover:bg-blue-600 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
          >
            Simpan Tagihan
          </button>
        </div>
      )}

      {/* DAFTAR TAGIHAN */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar max-h-[300px]">
        {pendingBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted2">
            <CheckCircle2 size={32} className="mb-2 text-invest opacity-50" />
            <p className="text-sm font-medium">Hore! Semua tagihan beres 🎉</p>
          </div>
        ) : (
          pendingBills.map(bill => {
            const isLunas = bill.is_lunas;
            const d = new Date(bill.jatuh_tempo);
            const dateStr = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;

            return (
              <div key={bill.id} className="flex items-center justify-between p-3 rounded-xl border transition-all bg-surface border-border hover:border-income/30">
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={() => toggleBill(bill.id, isLunas)} className="flex-shrink-0 transition-colors text-muted2 hover:text-income">
                    <Circle size={24} />
                  </button>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate text-text-2">
                      {bill.nama_tagihan}
                    </p>
                    <p className="text-[11px] font-semibold text-muted2 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> Jatuh Tempo: {dateStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3">
                  <span className="text-sm font-bold tabular-nums text-text-2">
                    {fmtShort(bill.amount)}
                  </span>
                  <button onClick={() => deleteBill(bill.id)} className="text-muted2 hover:text-expense transition-colors">
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
