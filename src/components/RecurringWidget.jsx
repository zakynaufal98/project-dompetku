import { useState } from 'react'
import { useData } from '../context/DataContext'
import { CATEGORY_TREE, fmtShort, CAT_ICONS } from '../lib/utils'
import { Repeat, Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react'

export default function RecurringWidget() {
  const { recurringData, addRecurring, deleteRecurring, walletData } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('out')
  const [cat, setCat] = useState('')
  const [walletId, setWalletId] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDate, setNextDate] = useState('')

  const availableCategories = Object.keys(CATEGORY_TREE[type] || {})

  const handleSave = async () => {
    if (!desc || !amount || !cat || !nextDate) return
    await addRecurring({
      desc_text: desc,
      amount: Number(amount),
      tx_type: type,
      cat,
      sub_cat: 'Lainnya',
      wallet_id: walletId || null,
      frequency,
      next_date: nextDate,
      is_active: true
    })
    setIsOpen(false); setDesc(''); setAmount(''); setCat(''); setNextDate('')
  }

  const freqLabels = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' }

  return (
    <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Repeat size={20} className="text-teal-500" /> Transaksi Berulang
          </h3>
          <p className="text-xs text-muted font-medium mt-0.5">Otomatis catat pengeluaran rutin</p>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg text-muted2 hover:text-teal-500 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="bg-bg border border-border2 rounded-2xl p-4 mb-5 animate-fade-in space-y-3">
          <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
            <button onClick={() => {setType('out'); setCat('')}} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'out' ? 'bg-expense text-white' : 'text-muted'}`}>Pengeluaran</button>
            <button onClick={() => {setType('in'); setCat('')}} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'in' ? 'bg-income text-white' : 'text-muted'}`}>Pemasukan</button>
          </div>
          
          <div><input type="text" placeholder="Keterangan (Mis: Langganan Netflix)" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full text-sm p-2 rounded-lg bg-surface border border-border outline-none focus:border-teal-500 text-text" /></div>
          <div><input type="number" placeholder="Nominal (Rp)" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full text-sm p-2 rounded-lg bg-surface border border-border outline-none focus:border-teal-500 text-text tabular-nums" /></div>
          
          <div className="grid grid-cols-2 gap-2">
            <select value={cat} onChange={e=>setCat(e.target.value)} className="text-sm p-2 rounded-lg bg-surface border border-border outline-none text-text">
              <option value="" disabled>Kategori...</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={walletId} onChange={e=>setWalletId(e.target.value)} className="text-sm p-2 rounded-lg bg-surface border border-border outline-none text-text">
              <option value="">(Tanpa Dompet)</option>
              {walletData.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <select value={frequency} onChange={e=>setFrequency(e.target.value)} className="text-sm p-2 rounded-lg bg-surface border border-border outline-none text-text">
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
            <input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} className="text-sm p-2 rounded-lg bg-surface border border-border outline-none text-text" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 bg-teal-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-teal-700">Simpan</button>
            <button onClick={() => setIsOpen(false)} className="px-4 bg-surface border border-border text-text text-xs font-bold py-2.5 rounded-lg hover:bg-bg">Batal</button>
          </div>
        </div>
      )}

      {recurringData.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {recurringData.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-bg border border-border rounded-2xl group">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${r.tx_type === 'out' ? 'bg-expense-light text-expense' : 'bg-income-light text-income'}`}>
                  {r.tx_type === 'out' ? <Clock size={16} /> : <Calendar size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-text leading-tight">{r.desc_text}</p>
                  <p className="text-[10px] text-muted font-medium mt-0.5">Setiap {freqLabels[r.frequency]} • {r.cat}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${r.tx_type === 'out' ? 'text-expense' : 'text-income'}`}>{r.tx_type === 'out' ? '-' : '+'}{fmtShort(r.amount)}</p>
                  <p className="text-[9px] text-muted font-bold mt-0.5 bg-surface border border-border2 px-1.5 py-0.5 rounded inline-block">Nxt: {new Date(r.next_date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                </div>
                <button onClick={() => deleteRecurring(r.id)} className="p-1.5 text-muted2 hover:text-expense opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isOpen && (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-muted2">Belum ada transaksi berulang.</p>
          </div>
        )
      )}
    </div>
  )
}
