import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { CATEGORY_TREE, fmtShort, CAT_ICONS, CHART_COLORS, isCashflowExpenseTx } from '../lib/utils'
import { Plus, Trash2, Edit2, Target, AlertTriangle, Check, X } from 'lucide-react'
import { ProgressBar } from './UI'

export default function BudgetWidget() {
  const { txData, budgetData, saveBudget, deleteBudget } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [editingCat, setEditingCat] = useState('')
  const [amount, setAmount] = useState('')
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const now = new Date()
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Hitung pengeluaran bulan ini per kategori
  const expensesThisMonth = useMemo(() => {
    const expenses = {}
    txData.filter(t => t.date?.startsWith(currentMonthPrefix) && isCashflowExpenseTx(t)).forEach(t => {
      const cat = t.cat || 'Lainnya'
      expenses[cat] = (expenses[cat] || 0) + t.amount
    })
    return expenses
  }, [txData, currentMonthPrefix])

  // Hitung status budget
  const budgetStatus = useMemo(() => {
    return budgetData.map(b => {
      const spent = expensesThisMonth[b.category] || 0
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
      return { ...b, spent, pct }
    }).sort((a, b) => b.pct - a.pct)
  }, [budgetData, expensesThisMonth])

  const availableCategories = Object.keys(CATEGORY_TREE.out).filter(c => c !== 'Lainnya')

  const handleEdit = (b) => {
    setEditingBudgetId(b.id)
    setEditingCat(b.category)
    setAmount(String(b.amount))
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setEditingCat('')
    setAmount('')
    setEditingBudgetId(null)
  }

  const handleSave = async () => {
    if (!editingCat || !amount) return
    await saveBudget(editingCat, Number(amount))
    handleClose()
  }

  const handleConfirmDelete = async (id) => {
    await deleteBudget(id)
    setConfirmDel(null)
  }

  return (
    <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-lg text-text flex items-center gap-2">
            <Target size={20} className="text-indigo-500" /> Anggaran Bulanan
          </h3>
          <p className="text-xs text-muted font-medium mt-0.5">Kontrol batas pengeluaranmu</p>
        </div>
        <button
          onClick={isOpen ? handleClose : () => { setEditingBudgetId(null); setEditingCat(''); setAmount(''); setIsOpen(true) }}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-expense-light text-expense' : 'bg-bg text-muted2 hover:text-indigo-500'}`}
        >
          {isOpen ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="bg-bg border border-border2 rounded-2xl p-4 mb-5 animate-fade-in">
          <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">{editingBudgetId ? 'Edit Anggaran' : 'Tambah Anggaran'}</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted ml-1 block mb-1">Kategori</label>
              {editingBudgetId ? (
                <div className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text font-semibold flex items-center gap-2">
                  <span className="opacity-70">{CAT_ICONS[editingCat]}</span> {editingCat}
                </div>
              ) : (
                <select
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-indigo-500"
                  value={editingCat}
                  onChange={e => setEditingCat(e.target.value)}
                >
                  <option value="" disabled>Pilih kategori...</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-muted ml-1 block mb-1">Batas Maksimal (Rp)</label>
              <input
                type="number"
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text outline-none focus:border-indigo-500 font-medium tabular-nums"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Mis: 1500000"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {editingBudgetId ? 'Update' : 'Simpan'}
              </button>
              <button
                onClick={handleClose}
                className="px-4 bg-surface border border-border text-text text-xs font-bold py-2.5 rounded-xl hover:bg-bg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {budgetStatus.length > 0 ? (
        <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {budgetStatus.map((b, i) => {
            const isWarning = b.pct >= 85
            const isDanger = b.pct >= 100
            const color = isDanger ? '#E11D48' : isWarning ? '#F5A623' : '#10B981'
            
            return (
              <div key={b.id} className="group relative">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-sm font-semibold text-text-2 flex items-center gap-2">
                    <span className="opacity-70 scale-90">{CAT_ICONS[b.category]}</span> 
                    {b.category}
                  </span>
                  <div className="text-right">
                    <span className={`text-xs font-bold tabular-nums ${isDanger ? 'text-expense' : 'text-text'}`}>
                      {fmtShort(b.spent)}
                    </span>
                    <span className="text-[10px] font-semibold text-muted ml-1 tabular-nums">/ {fmtShort(b.amount)}</span>
                  </div>
                </div>
                
                <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min(100, b.pct)}%`, backgroundColor: color }} 
                  />
                </div>
                
                {isDanger && (
                  <p className="text-[10px] text-expense font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} /> Melebihi anggaran!
                  </p>
                )}

                {confirmDel === b.id ? (
                  <div className="flex items-center gap-1.5 mt-2 animate-fade-in">
                    <span className="text-[10px] font-bold text-expense">Hapus anggaran ini?</span>
                    <button onClick={() => handleConfirmDelete(b.id)} className="w-6 h-6 bg-expense text-white rounded-full flex items-center justify-center hover:opacity-80"><Check size={12} /></button>
                    <button onClick={() => setConfirmDel(null)} className="w-6 h-6 bg-border text-muted rounded-full flex items-center justify-center hover:bg-border2"><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(b)} className="p-1 text-muted2 hover:text-indigo-500 transition-colors" title="Edit">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(b.id)} className="p-1 text-muted2 hover:text-expense transition-colors" title="Hapus">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        !isOpen && (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-muted2">Belum ada anggaran. <br/>Buat untuk membatasi pengeluaranmu.</p>
          </div>
        )
      )}
    </div>
  )
}
