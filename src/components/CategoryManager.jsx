import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'
import { CATEGORY_TREE } from '../lib/utils'
import { X, Plus, Trash2, Eye, EyeOff, Loader2, Tag } from 'lucide-react'

export default function CategoryManager({ open, onClose, type: initType = 'out' }) {
  const { userCustomCats, userHiddenCats, addCustomCat, deleteCustomCat, toggleHideDefaultCat } = useData()
  const [activeType, setActiveType] = useState(initType)
  const [newMain, setNewMain] = useState('')
  const [newSubs, setNewSubs] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { if (open) setActiveType(initType) }, [open, initType])

  const defaultCats = Object.keys(CATEGORY_TREE[activeType] || {})
  const customCats = userCustomCats.filter(c => c.type === activeType)
  const hiddenSet = new Set(userHiddenCats.filter(h => h.type === activeType).map(h => h.main_cat))

  const handleAdd = async () => {
    if (!newMain.trim()) { setErr('Nama kategori wajib diisi'); return }
    const alreadyExists = customCats.some(c => c.main_cat.toLowerCase() === newMain.trim().toLowerCase())
    if (alreadyExists) { setErr('Kategori dengan nama ini sudah ada'); return }
    const sub_cats = newSubs.split(',').map(s => s.trim()).filter(Boolean)
    setBusy(true); setErr('')
    const error = await addCustomCat(activeType, newMain.trim(), sub_cats)
    setBusy(false)
    if (error) { setErr(error.message || 'Gagal menyimpan'); return }
    setNewMain(''); setNewSubs('')
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-border shadow-2xl flex flex-col max-h-[85dvh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-text text-base">Kelola Kategori</h3>
            <p className="text-xs text-muted mt-0.5">Tambah custom atau sembunyikan kategori bawaan</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg text-muted2 hover:text-expense transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 px-6 pt-4 shrink-0">
          <button
            onClick={() => setActiveType('out')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              activeType === 'out'
                ? 'bg-gold-light text-gold border-gold/30'
                : 'bg-bg text-muted border-transparent hover:border-border2'
            }`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveType('in')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              activeType === 'in'
                ? 'bg-income-light text-income border-income/30'
                : 'bg-bg text-muted border-transparent hover:border-border2'
            }`}
          >
            Pemasukan
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 px-6 py-4 space-y-5">

          {/* Default categories */}
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
              Kategori Bawaan
            </p>
            <div className="space-y-2">
              {defaultCats.map(cat => {
                const isHidden = hiddenSet.has(cat)
                return (
                  <div
                    key={cat}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isHidden ? 'bg-bg border-border opacity-50' : 'bg-surface border-border2'
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isHidden ? 'text-muted line-through' : 'text-text'}`}>
                      {cat}
                    </span>
                    <button
                      onClick={() => toggleHideDefaultCat(activeType, cat)}
                      title={isHidden ? 'Tampilkan' : 'Sembunyikan'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isHidden
                          ? 'bg-muted/10 text-muted hover:bg-income-light hover:text-income'
                          : 'bg-bg text-muted2 hover:bg-expense-light hover:text-expense'
                      }`}
                    >
                      {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom categories */}
          {customCats.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
                Kategori Custom
              </p>
              <div className="space-y-2">
                {customCats.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-start justify-between px-4 py-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-700/30"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{cat.main_cat}</span>
                      {cat.sub_cats?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cat.sub_cats.map(s => (
                            <span
                              key={s}
                              className="text-[10px] font-semibold bg-teal-100 dark:bg-teal-800/40 text-teal-600 dark:text-teal-300 px-2 py-0.5 rounded-md"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCustomCat(cat.id)}
                      title="Hapus kategori"
                      className="w-8 h-8 rounded-lg bg-bg text-muted2 hover:bg-expense-light hover:text-expense flex items-center justify-center transition-colors shrink-0 ml-2 mt-0.5"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new custom category form */}
          <div className="bg-bg rounded-2xl border border-border p-4 space-y-3">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
              <Plus size={12} /> Tambah Kategori Custom
            </p>
            <input
              className="form-input py-2.5 w-full"
              placeholder="Nama kategori (mis: Hobi Baru)"
              value={newMain}
              onChange={e => { setNewMain(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              className="form-input py-2.5 w-full"
              placeholder="Sub kategori, pisah koma (opsional)"
              value={newSubs}
              onChange={e => setNewSubs(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {err && <p className="text-xs text-expense font-medium">{err}</p>}
            <button
              onClick={handleAdd}
              disabled={busy}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
              Simpan Kategori
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
