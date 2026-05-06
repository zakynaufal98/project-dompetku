import { useState } from 'react'
import { useData } from '../context/DataContext'
import { CATEGORY_TREE, fmtShort } from '../lib/utils'
import { Repeat, Plus, Trash2, Calendar, Clock, Pencil, Check, X } from 'lucide-react'

export default function RecurringWidget() {
  const { recurringData, addRecurring, updateRecurring, deleteRecurring, walletData } = useData()

  const [isOpen, setIsOpen]       = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [desc, setDesc]           = useState('')
  const [amount, setAmount]       = useState('')
  const [type, setType]           = useState('out')
  const [cat, setCat]             = useState('')
  const [walletId, setWalletId]   = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDate, setNextDate]   = useState('')
  const [confirmDel, setConfirmDel] = useState(null) // id yang dikonfirmasi

  const availableCategories = Object.keys(CATEGORY_TREE[type] || {})
  const freqLabels = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' }

  const resetForm = () => {
    setEditingId(null); setDesc(''); setAmount(''); setCat(''); setNextDate('')
    setType('out'); setFrequency('monthly'); setWalletId('')
  }

  const handleOpen = () => { resetForm(); setIsOpen(true) }
  const handleClose = () => { resetForm(); setIsOpen(false) }

  const handleEdit = (r) => {
    setEditingId(r.id)
    setDesc(r.desc_text)
    setAmount(String(r.amount))
    setType(r.tx_type)
    setCat(r.cat)
    setWalletId(r.wallet_id || '')
    setFrequency(r.frequency)
    setNextDate(r.next_date)
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!desc || !amount || !cat || !nextDate) return
    const payload = {
      desc_text: desc, amount: Number(amount), tx_type: type,
      cat, sub_cat: 'Lainnya', wallet_id: walletId || null,
      frequency, next_date: nextDate, is_active: true
    }
    if (editingId) {
      await updateRecurring(editingId, payload)
    } else {
      await addRecurring(payload)
    }
    handleClose()
  }

  const handleConfirmDelete = async (id) => {
    await deleteRecurring(id)
    setConfirmDel(null)
  }

  const inputCls = "w-full text-sm p-2 rounded-lg bg-surface border border-border outline-none focus:border-teal-500 text-text"

  return (
    <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Repeat size={20} className="text-teal-500" /> Transaksi Berulang
          </h3>
          <p className="text-xs text-muted font-medium mt-0.5">Otomatis catat pengeluaran rutin</p>
        </div>
        <button onClick={isOpen ? handleClose : handleOpen}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-expense-light text-expense' : 'bg-bg text-muted2 hover:text-teal-500'}`}>
          {isOpen ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-bg border border-border2 rounded-2xl p-4 mb-5 animate-fade-in space-y-3">
          <p className="text-xs font-bold text-muted uppercase tracking-widest">{editingId ? 'Edit Transaksi Berulang' : 'Tambah Baru'}</p>
          <div className="flex gap-2 bg-surface p-1 rounded-lg border border-border">
            <button onClick={() => { setType('out'); setCat('') }} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'out' ? 'bg-expense text-white' : 'text-muted'}`}>Pengeluaran</button>
            <button onClick={() => { setType('in'); setCat('') }} className={`flex-1 text-xs font-bold py-1.5 rounded ${type === 'in' ? 'bg-income text-white' : 'text-muted'}`}>Pemasukan</button>
          </div>

          <input type="text" placeholder="Keterangan (Mis: Langganan Netflix)" value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
          <input type="number" placeholder="Nominal (Rp)" value={amount} onChange={e => setAmount(e.target.value)} className={`${inputCls} tabular-nums`} />

          <div className="grid grid-cols-2 gap-2">
            <select value={cat} onChange={e => setCat(e.target.value)} className={inputCls}>
              <option value="" disabled>Kategori...</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className={inputCls}>
              <option value="">(Tanpa Dompet)</option>
              {walletData.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className={inputCls}>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
            <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className={inputCls} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="flex-1 bg-teal-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-teal-700">
              {editingId ? 'Update' : 'Simpan'}
            </button>
            <button onClick={handleClose} className="px-4 bg-surface border border-border text-text text-xs font-bold py-2.5 rounded-lg hover:bg-bg">Batal</button>
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
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${r.tx_type === 'out' ? 'text-expense' : 'text-income'}`}>{r.tx_type === 'out' ? '-' : '+'}{fmtShort(r.amount)}</p>
                  <p className="text-[9px] text-muted font-bold mt-0.5 bg-surface border border-border2 px-1.5 py-0.5 rounded inline-block">Nxt: {new Date(r.next_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
                {confirmDel === r.id ? (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <span className="text-[10px] font-bold text-expense">Hapus?</span>
                    <button onClick={() => handleConfirmDelete(r.id)} className="w-6 h-6 bg-expense text-white rounded-full flex items-center justify-center hover:opacity-80"><Check size={12} /></button>
                    <button onClick={() => setConfirmDel(null)} className="w-6 h-6 bg-border text-muted rounded-full flex items-center justify-center hover:bg-border2"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(r)} className="p-1.5 text-muted2 hover:text-primary"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDel(r.id)} className="p-1.5 text-muted2 hover:text-expense"><Trash2 size={14} /></button>
                  </div>
                )}
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
