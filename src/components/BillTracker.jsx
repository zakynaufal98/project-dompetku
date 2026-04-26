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

  // Hitung ringkasan
  const pendingBills = billData.filter(b => !b.is_lunas)
  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0)

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BellRing size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 tracking-tight">Tagihan Bulanan</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {pendingBills.length} tagihan belum dibayar ({fmtShort(totalPending)})
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* FORM TAMBAH TAGIHAN */}
      {showForm && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 animate-fade-up">
          <div className="space-y-3 mb-3">
            <input 
              type="text" placeholder="Nama Tagihan (Mis: Netflix)" 
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
            />
            <div className="flex gap-3">
              <input 
                type="text" placeholder="Nominal (Rp)" 
                value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                className="w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
              />
              <input 
                type="date" 
                value={date} onChange={e => setDate(e.target.value)}
                className="w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none cursor-pointer"
              />
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 rounded-lg transition-colors"
          >
            Simpan Tagihan
          </button>
        </div>
      )}

      {/* DAFTAR TAGIHAN */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar max-h-[300px]">
        {billData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Calendar size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Belum ada tagihan dicatat</p>
          </div>
        ) : (
          billData.map(bill => {
            const isLunas = bill.is_lunas;
            // Format tanggal (contoh: 24 Apr)
            const d = new Date(bill.jatuh_tempo);
            const dateStr = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;

            return (
              <div key={bill.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isLunas ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={() => toggleBill(bill.id, isLunas)} className={`flex-shrink-0 transition-colors ${isLunas ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'}`}>
                    {isLunas ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-bold truncate ${isLunas ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                      {bill.nama_tagihan}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> Jatuh Tempo: {dateStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3">
                  <span className={`text-sm font-bold tabular-nums ${isLunas ? 'text-slate-400' : 'text-slate-700'}`}>
                    {fmtShort(bill.amount)}
                  </span>
                  {!isLunas && (
                    <button onClick={() => deleteBill(bill.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                    )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}