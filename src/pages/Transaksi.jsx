import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader } from '../components/UI'
import DescInput from '../components/DescInput'
import RecurringWidget from '../components/RecurringWidget'
import CategoryManager from '../components/CategoryManager'
import {
  ArrowDownLeft, ArrowUpRight, Banknote,
  Calendar, PlusCircle, ReceiptText, Loader2, Search,
  Wallet, ChevronDown, Sparkles, BriefcaseBusiness, ArrowUpDown, X, Check, SlidersHorizontal
} from 'lucide-react'

export default function Transaksi() {
  const { txData, addTx, updateTx, deleteTx, totals, walletData, effectiveCategoryTree, addCustomCat } = useData()

  // ── Add form state ──────────────────────────────────────
  const [type, setType] = useState('out')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [mainCat, setMainCat] = useState('')
  const [subCat, setSubCat] = useState('')
  const [date, setDate] = useState(today())
  const [walletId, setWalletId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // ── Edit modal state ────────────────────────────────────
  const [editId, setEditId] = useState(null)
  const [editType, setEditType] = useState('out')
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editMainCat, setEditMainCat] = useState('')
  const [editSubCat, setEditSubCat] = useState('')
  const [editDate, setEditDate] = useState(today())
  const [editWalletId, setEditWalletId] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [editErr, setEditErr] = useState('')

  // ── Category Manager modal ───────────────────────────────
  const [showCatManager, setShowCatManager] = useState(false)
  const [catManagerType, setCatManagerType] = useState('out')

  // ── Inline add-category form (add form) ─────────────────
  const [showAddCatForm, setShowAddCatForm] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [newCatBusy, setNewCatBusy] = useState(false)

  // ── Inline add-category form (edit modal) ────────────────
  const [showEditAddCatForm, setShowEditAddCatForm] = useState(false)
  const [editNewCatInput, setEditNewCatInput] = useState('')
  const [editNewCatBusy, setEditNewCatBusy] = useState(false)

  // ── Filter / sort state ─────────────────────────────────
  const [filter, setFilter] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(today().substring(0, 7))
  const [sortBy, setSortBy] = useState('terbaru')

  useEffect(() => {
    if (walletData?.length > 0 && !walletId) setWalletId(walletData[0].id)
  }, [walletData, walletId])

  // ── Auto-categorization (add form) ──────────────────────
  const handleDescChange = (val) => {
    setDesc(val)
    if (val.trim().length > 2) {
      const pastMatch = txData.find(t => t.desc?.toLowerCase() === val.trim().toLowerCase())
      if (pastMatch?.cat) {
        setType(pastMatch.type)
        setMainCat(pastMatch.cat)
        setSubCat(pastMatch.sub_cat || '')
      }
    }
  }

  const handleTypeChange = (newType) => { setType(newType); setMainCat(''); setSubCat(''); setShowAddCatForm(false); setNewCatInput('') }

  const handleSaveNewCat = async () => {
    if (!newCatInput.trim()) return
    setNewCatBusy(true)
    const error = await addCustomCat(type, newCatInput.trim(), [])
    setNewCatBusy(false)
    if (!error) { setMainCat(newCatInput.trim()); setSubCat(''); setNewCatInput(''); setShowAddCatForm(false) }
  }

  const handleSaveEditNewCat = async () => {
    if (!editNewCatInput.trim()) return
    setEditNewCatBusy(true)
    const error = await addCustomCat(editType, editNewCatInput.trim(), [])
    setEditNewCatBusy(false)
    if (!error) { setEditMainCat(editNewCatInput.trim()); setEditSubCat(''); setEditNewCatInput(''); setShowEditAddCatForm(false) }
  }

  // ── Edit modal handlers ────────────────────────────────
  const handleEdit = (t) => {
    setEditId(t.id)
    setEditType(t.type)
    setEditDesc(t.desc)
    setEditAmount(String(t.amount))
    setEditMainCat(t.cat || '')
    setEditSubCat(t.sub_cat || '')
    setEditDate(t.date)
    setEditWalletId(t.wallet_id || walletData?.[0]?.id || '')
    setEditErr('')
  }

  const handleCloseEdit = () => { setEditId(null); setEditErr('') }

  const handleEditTypeChange = (newType) => { setEditType(newType); setEditMainCat(''); setEditSubCat('') }

  // ── Computed cats ──────────────────────────────────────
  const suggestedAmounts = useMemo(() => {
    if (!desc.trim()) return []
    const matches = txData.filter(t => t.desc?.toLowerCase() === desc.trim().toLowerCase() && t.type === type)
    return [...new Set(matches.map(t => t.amount))].slice(0, 3)
  }, [desc, txData, type])

  const availableMainCats = Object.keys(effectiveCategoryTree?.[type] || {})
  const availableSubCats = mainCat && effectiveCategoryTree?.[type]?.[mainCat] ? effectiveCategoryTree[type][mainCat] : []

  const editAvailableMainCats = Object.keys(effectiveCategoryTree?.[editType] || {})
  const editAvailableSubCats = editMainCat && effectiveCategoryTree?.[editType]?.[editMainCat] ? effectiveCategoryTree[editType][editMainCat] : []

  // ── Handlers ──────────────────────────────────────────
  const handleAdd = async () => {
    if (!desc.trim())          { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount<=0) { setErr('Jumlah harus lebih dari 0'); return }
    if (!mainCat)              { setErr('Kategori Induk wajib dipilih'); return }
    if (availableSubCats.length > 0 && !subCat) { setErr('Sub kategori wajib dipilih'); return }
    if (isAddBalanceInsufficient) {
      setErr(`Saldo ${activeWallet?.name || 'dompet'} tidak mencukupi. Sisa saldo: ${fmt(activeWallet?.calculatedBalance || 0)}`)
      return
    }

    setBusy(true); setErr('')
    const payload = { desc: desc.trim(), amount: +amount, type, cat: mainCat, sub_cat: subCat, date, wallet_id: walletId || null }
    const e = await addTx(payload)
    setBusy(false)
    if (e) setErr(e.message)
    else { setDesc(''); setAmount(''); setMainCat(''); setSubCat(''); setType('out') }
  }

  const handleSaveEdit = async () => {
    if (!editDesc.trim())              { setEditErr('Keterangan wajib diisi'); return }
    if (!editAmount || +editAmount<=0) { setEditErr('Jumlah harus lebih dari 0'); return }
    if (!editMainCat)                  { setEditErr('Kategori Induk wajib dipilih'); return }
    if (editAvailableSubCats.length > 0 && !editSubCat) { setEditErr('Sub kategori wajib dipilih'); return }
    if (isEditBalanceInsufficient) {
      setEditErr(`Saldo ${editActiveWallet?.name || 'dompet'} tidak mencukupi. Sisa saldo setelah edit: ${fmt(editProjectedBalance)}`)
      return
    }

    setEditBusy(true); setEditErr('')
    const payload = { desc: editDesc.trim(), amount: +editAmount, type: editType, cat: editMainCat, sub_cat: editSubCat, date: editDate, wallet_id: editWalletId || null }
    const e = await updateTx(editId, payload)
    setEditBusy(false)
    if (e) setEditErr(e.message)
    else handleCloseEdit()
  }

  // ── Filter / sort / group ──────────────────────────────
  const filtered = txData
    .filter(t => {
      const matchTab = filter === 'semua' || t.type === filter
      const matchMonth = selectedMonth ? t.date.startsWith(selectedMonth) : true
      const q = searchQuery.toLowerCase()
      const matchSearch = (t.desc?.toLowerCase().includes(q)) || (t.cat?.toLowerCase().includes(q))
      return matchTab && matchMonth && matchSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'terlama':  return new Date(a.date) - new Date(b.date) || a.ts - b.ts
        case 'terbesar': return b.amount - a.amount
        case 'terkecil': return a.amount - b.amount
        case 'az':       return (a.desc || '').localeCompare(b.desc || '', 'id')
        case 'za':       return (b.desc || '').localeCompare(a.desc || '', 'id')
        default:         return new Date(b.date) - new Date(a.date) || b.ts - a.ts
      }
    })

  const groupedTx = useMemo(() => {
    const groups = {}
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = { items: [], totalIn: 0, totalOut: 0 }
      groups[t.date].items.push(t)
      if (t.cat !== 'Transfer' && !t.cat?.startsWith('Transfer') && t.cat !== 'Piutang') {
        if (t.type === 'in') groups[t.date].totalIn += t.amount
        if (t.type === 'out') groups[t.date].totalOut += t.amount
      }
    })
    return groups
  }, [filtered])

  const monthlySummary = useMemo(() => {
    let inMonth = 0, outMonth = 0
    txData.forEach(t => {
      if (selectedMonth && !t.date.startsWith(selectedMonth)) return
      if (t.cat !== 'Transfer' && !t.cat?.startsWith('Transfer') && t.cat !== 'Piutang') {
        if (t.type === 'in') inMonth += t.amount
        if (t.type === 'out') outMonth += t.amount
      }
    })
    return { inMonth, outMonth }
  }, [txData, selectedMonth])

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr)
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const ds = d.toISOString().split('T')[0]
    if (ds === todayStr) return "Hari Ini"
    if (ds === yesterdayStr) return "Kemarin"
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const activeWallet     = totals?.walletBalances?.find(w => w.id === walletId)
  const editActiveWallet = totals?.walletBalances?.find(w => w.id === editWalletId)
  const editedTx = txData.find(t => t.id === editId)

  const getProjectedWalletBalance = ({ targetWalletId, nextType, nextAmount, originalTx = null }) => {
    if (!targetWalletId) return Infinity
    const wallet = totals?.walletBalances?.find(w => w.id === targetWalletId)
    if (!wallet) return Infinity

    let projected = Number(wallet.calculatedBalance) || 0
    if (originalTx?.wallet_id === targetWalletId) {
      if (originalTx.type === 'out') projected += Number(originalTx.amount) || 0
      if (originalTx.type === 'in') projected -= Number(originalTx.amount) || 0
    }

    if (nextType === 'out') projected -= Number(nextAmount) || 0
    if (nextType === 'in') projected += Number(nextAmount) || 0
    return projected
  }

  const addProjectedBalance = getProjectedWalletBalance({
    targetWalletId: walletId,
    nextType: type,
    nextAmount: +amount || 0
  })
  const editProjectedBalance = getProjectedWalletBalance({
    targetWalletId: editWalletId,
    nextType: editType,
    nextAmount: +editAmount || 0,
    originalTx: editedTx
  })
  const isAddBalanceInsufficient = type === 'out' && walletId && amount && addProjectedBalance < 0
  const isEditBalanceInsufficient = editType === 'out' && editWalletId && editAmount && editProjectedBalance < 0

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Keuangan</p>
          <h1 className="font-black text-2xl text-text tracking-tight">Transaksi</h1>
          <p className="text-muted text-sm font-medium mt-1">Catat dan pantau arus kas harianmu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── ADD FORM PANEL ───────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 lg:col-span-3 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #0d9488)' }}>
              <ReceiptText size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Form</p>
              <h3 className="font-black text-text text-base tracking-tight">Tambah Transaksi</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => handleTypeChange('in')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'in' ? 'bg-income-light text-income border-income/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowDownLeft size={18} strokeWidth={2.5} /> Pemasukan
            </button>
            <button onClick={() => handleTypeChange('out')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'out' ? 'bg-gold-light text-gold border-gold/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowUpRight size={18} strokeWidth={2.5} /> Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Keterangan / Tempat">
              <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={handleAdd} />
              <p className="text-[9px] text-income font-bold flex items-center mt-1.5 uppercase tracking-widest opacity-80">
                <Sparkles size={10} className="mr-1" /> Auto-Kategori Aktif
              </p>
            </Field>

            <Field label="Jumlah (Rp)">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10">
                  <Banknote size={16} strokeWidth={2.5} />
                </div>
                <input
                  className="form-input pl-14 py-3 relative z-0"
                  type="text" inputMode="numeric"
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
              {suggestedAmounts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5 animate-fade-in">
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider flex items-center mr-1">Terakhir:</span>
                  {suggestedAmounts.map((nominal, idx) => (
                    <button key={idx} type="button" onClick={() => setAmount(nominal.toString())}
                      className="px-2.5 py-1 bg-income-light text-income text-xs font-bold rounded-lg border border-income/20 hover:opacity-80 transition-opacity cursor-pointer shadow-sm active:scale-95">
                      {nominal.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-muted">Kategori Induk</label>
                <button
                  type="button"
                  onClick={() => { setCatManagerType(type); setShowCatManager(true) }}
                  className="flex items-center gap-1 text-[10px] font-bold text-teal-500 hover:text-teal-400 transition-colors"
                >
                  <SlidersHorizontal size={11} /> Kelola
                </button>
              </div>
              <div className="relative">
                <select className="form-input py-3 pl-4 pr-10 cursor-pointer appearance-none font-semibold text-text-2 text-sm w-full"
                  value={mainCat}
                  onChange={e => {
                    if (e.target.value === '__add__') { setShowAddCatForm(true); return }
                    setMainCat(e.target.value); setSubCat(''); setShowAddCatForm(false)
                  }}>
                  <option value="" disabled>Pilih Kategori...</option>
                  {availableMainCats.map(c => <option key={c} value={c}>{c}</option>)}
                  <option disabled>──────────────</option>
                  <option value="__add__">+ Tambah Kategori Baru</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} strokeWidth={2.5} /></div>
              </div>
              {showAddCatForm && (
                <div className="flex gap-2 animate-fade-in">
                  <input
                    className="form-input py-2 flex-1 text-sm"
                    placeholder="Nama kategori baru..."
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveNewCat(); if (e.key === 'Escape') { setShowAddCatForm(false); setNewCatInput('') } }}
                    autoFocus
                  />
                  <button onClick={handleSaveNewCat} disabled={newCatBusy}
                    className="px-3 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors">
                    {newCatBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setShowAddCatForm(false); setNewCatInput('') }}
                    className="px-3 rounded-xl bg-bg text-muted hover:text-text transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <Field label="Sub Kategori">
              <div className="relative">
                <select className="form-input py-3 pl-4 pr-10 cursor-pointer appearance-none font-semibold text-text-2 text-sm w-full disabled:opacity-50"
                  value={subCat} onChange={e => setSubCat(e.target.value)}
                  disabled={!mainCat || availableSubCats.length === 0}>
                  <option value="" disabled>Pilih Detail...</option>
                  {availableSubCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} strokeWidth={2.5} /></div>
              </div>
            </Field>

            <Field label="Pilih Dompet / Rekening">
              {totals?.walletBalances?.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white"
                    style={{ backgroundColor: activeWallet?.color || '#94a3b8' }}>
                    <Wallet size={16} strokeWidth={2.5} />
                  </div>
                  <select className="form-input pl-14 pr-10 py-3 cursor-pointer appearance-none font-semibold text-text-2 w-full"
                    value={walletId} onChange={e => setWalletId(e.target.value)}>
                    <option value="" disabled>Pilih Sumber Dana...</option>
                    {totals.walletBalances.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} — {w.calculatedBalance < 0 ? '-' : ''}Rp {Math.abs(w.calculatedBalance).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} strokeWidth={2.5} /></div>
                </div>
              ) : (
                <div className="bg-bg border border-border rounded-xl px-4 py-3 text-sm text-muted flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400" /> Belum ada dompet. Buat di Dashboard!
                </div>
              )}
              {isAddBalanceInsufficient && (
                <p className="mt-2 text-[11px] font-bold text-expense">
                  Saldo kurang. Maksimal pengeluaran dari dompet ini {fmt(activeWallet?.calculatedBalance || 0)}.
                </p>
              )}
            </Field>

            <Field label="Tanggal">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
                <input className="form-input pl-14 py-3 cursor-pointer text-sm relative z-0"
                  type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </Field>
          </div>

          {err && <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{err}</div>}

          <button onClick={handleAdd} disabled={busy || isAddBalanceInsufficient}
            className={`w-full py-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 mt-2 ${
              type === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
            }`}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
            Simpan Transaksi
          </button>
        </div>

        {/* ── QUICK STATS ──────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title={selectedMonth ? "Ringkasan Bulan Ini" : "Ringkasan Semua Waktu"} sub="Statistik" />

          <div className="mt-2 space-y-3.5">
            <div className="bg-income/5 border border-income/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-income/10 hover:border-income/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-income-light text-income flex items-center justify-center shadow-inner"><ArrowDownLeft size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pemasukan</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Murni</span>
                </div>
              </div>
              <span className="text-income font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.inMonth)}</span>
            </div>

            <div className="bg-gold/5 border border-gold/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-gold/10 hover:border-gold/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gold-light text-gold flex items-center justify-center shadow-inner"><ArrowUpRight size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pengeluaran</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Murni</span>
                </div>
              </div>
              <span className="text-gold font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.outMonth)}</span>
            </div>

            <div className="bg-invest/5 border border-invest/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-invest/10 hover:border-invest/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-invest-light text-invest flex items-center justify-center shadow-inner"><BriefcaseBusiness size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Investasi</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Total</span>
                </div>
              </div>
              <span className="text-invest font-black text-lg md:text-xl tracking-tight">{fmt(Math.max(0, totals.invNet))}</span>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center bg-bg/50 border border-border2 rounded-[24px] p-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-income via-invest to-gold"></div>
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Wallet size={12} /> Saldo Bersih Keseluruhan
              </span>
              <span className={`tabular-nums font-black text-3xl md:text-4xl tracking-tight ${totals.saldo >= 0 ? 'text-text' : 'text-expense'}`}>
                {fmt(totals.saldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST RIWAYAT ────── */}
      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm transition-colors">
        <PanelHeader title="Riwayat Transaksi" sub="Histori" badge={`${filtered.length} transaksi`} />

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={filter} onChange={setFilter} options={[
            { value: 'semua', label: 'Semua' },
            { value: 'in',    label: 'Pemasukan' },
            { value: 'out',   label: 'Pengeluaran' },
          ]} />

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {selectedMonth && (
              <button onClick={() => setSelectedMonth('')}
                className="bg-bg hover:bg-border text-muted hover:text-text-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0">
                Semua
              </button>
            )}
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="bg-field border border-border2 rounded-xl px-4 py-2.5 text-sm font-bold text-text-2 focus:border-income outline-none cursor-pointer hover:bg-bg transition-colors flex-1 min-w-[140px]" />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 z-10 pointer-events-none"><ArrowUpDown size={14} /></div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-field border border-border2 rounded-xl pl-8 pr-8 py-2.5 text-sm font-bold text-text-2 focus:border-income outline-none cursor-pointer hover:bg-bg transition-colors appearance-none">
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                <option value="terbesar">Terbesar</option>
                <option value="terkecil">Terkecil</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted2"><ChevronDown size={14} /></div>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 z-10"><Search size={18} /></div>
          <input type="text" placeholder="Cari transaksi berdasarkan nama atau kategori..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-field border border-border2 text-text placeholder:text-muted2 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-surface outline-none transition-all" />
        </div>

        <div className="lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedTx).length > 0 ? (
            Object.keys(groupedTx).map(dateKey => {
              const group = groupedTx[dateKey]
              const isToday = getDayLabel(dateKey) === "Hari Ini"
              return (
                <div key={dateKey} className="mb-8 last:mb-0 animate-fade-up">
                  <div className="flex items-center justify-between border-b-2 border-border pb-2.5 mb-3 sticky top-0 bg-surface z-10 transition-colors">
                    <h4 className={`font-bold text-sm ${isToday ? 'text-income' : 'text-text-2'}`}>{getDayLabel(dateKey)}</h4>
                    <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                      {group.totalIn > 0 && <span className="text-income">+ {fmtShort(group.totalIn)}</span>}
                      {group.totalOut > 0 && <span className="text-gold">- {fmtShort(group.totalOut)}</span>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map(t => (
                      <TxItem key={`tx-${t.id}`} t={t} onDelete={deleteTx} onEdit={handleEdit} isInv={false}
                        walletName={walletData?.find(w => w.id === t.wallet_id)?.name}
                        inputterName={t.created_by_email ? t.created_by_email.split('@')[0] : null} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8">
              <Empty icon={<ReceiptText size={40} className="text-muted2 mb-3" strokeWidth={1} />}
                text={selectedMonth ? "Transaksi tidak ditemukan di bulan ini" : "Transaksi tidak ditemukan"} />
            </div>
          )}
        </div>
      </div>

      <RecurringWidget />

      <CategoryManager
        open={showCatManager}
        onClose={() => setShowCatManager(false)}
        type={catManagerType}
      />

      {/* ── EDIT MODAL (portal) ───────────────────────────── */}
      {editId && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-surface w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-border shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-text text-base">Edit Transaksi</h3>
                <p className="text-xs text-muted mt-0.5">Ubah detail lalu simpan</p>
              </div>
              <button onClick={handleCloseEdit} className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg text-muted2 hover:text-expense transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleEditTypeChange('in')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-all ${
                    editType === 'in' ? 'bg-income-light text-income border-income/30' : 'bg-bg text-muted border-transparent hover:border-border2'
                  }`}>
                  <ArrowDownLeft size={16} strokeWidth={2.5} /> Pemasukan
                </button>
                <button onClick={() => handleEditTypeChange('out')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-all ${
                    editType === 'out' ? 'bg-gold-light text-gold border-gold/30' : 'bg-bg text-muted border-transparent hover:border-border2'
                  }`}>
                  <ArrowUpRight size={16} strokeWidth={2.5} /> Pengeluaran
                </button>
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Keterangan / Tempat</label>
                <input className="form-input py-2.5 w-full"
                  value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  placeholder="Mis: Makan siang, Grab..." />
              </div>

              {/* Jumlah */}
              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Jumlah (Rp)</label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10">
                    <Banknote size={16} strokeWidth={2.5} />
                  </div>
                  <input className="form-input pl-14 py-2.5 w-full relative z-0"
                    type="text" inputMode="numeric"
                    value={editAmount ? Number(editAmount).toLocaleString('id-ID') : ''}
                    onChange={e => setEditAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="0" />
                </div>
              </div>

              {/* Kategori + Sub */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted ml-1 block mb-1">Kategori Induk</label>
                  <div className="relative">
                    <select className="form-input py-2.5 pl-3 pr-8 cursor-pointer appearance-none font-semibold text-text-2 text-sm w-full"
                      value={editMainCat}
                      onChange={e => {
                        if (e.target.value === '__add__') { setShowEditAddCatForm(true); return }
                        setEditMainCat(e.target.value); setEditSubCat(''); setShowEditAddCatForm(false)
                      }}>
                      <option value="" disabled>Pilih...</option>
                      {editAvailableMainCats.map(c => <option key={c} value={c}>{c}</option>)}
                      <option disabled>──────────</option>
                      <option value="__add__">+ Tambah Baru</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={15} /></div>
                  </div>
                  {showEditAddCatForm && (
                    <div className="flex gap-1.5 mt-2 animate-fade-in col-span-2">
                      <input
                        className="form-input py-1.5 flex-1 text-xs"
                        placeholder="Nama kategori..."
                        value={editNewCatInput}
                        onChange={e => setEditNewCatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEditNewCat(); if (e.key === 'Escape') { setShowEditAddCatForm(false); setEditNewCatInput('') } }}
                        autoFocus
                      />
                      <button onClick={handleSaveEditNewCat} disabled={editNewCatBusy}
                        className="px-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors">
                        {editNewCatBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                      <button onClick={() => { setShowEditAddCatForm(false); setEditNewCatInput('') }}
                        className="px-2.5 rounded-xl bg-bg text-muted hover:text-text transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-muted ml-1 block mb-1">Sub Kategori</label>
                  <div className="relative">
                    <select className="form-input py-2.5 pl-3 pr-8 cursor-pointer appearance-none font-semibold text-text-2 text-sm w-full disabled:opacity-50"
                      value={editSubCat} onChange={e => setEditSubCat(e.target.value)}
                      disabled={!editMainCat || editAvailableSubCats.length === 0}>
                      <option value="" disabled>Pilih...</option>
                      {editAvailableSubCats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={15} /></div>
                  </div>
                </div>
              </div>

              {/* Wallet */}
              {totals?.walletBalances?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-muted ml-1 block mb-1">Dompet / Rekening</label>
                  <div className="relative">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white"
                      style={{ backgroundColor: editActiveWallet?.color || '#94a3b8' }}>
                      <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <select className="form-input pl-14 pr-10 py-2.5 cursor-pointer appearance-none font-semibold text-text-2 w-full"
                      value={editWalletId} onChange={e => setEditWalletId(e.target.value)}>
                      <option value="" disabled>Pilih Sumber Dana...</option>
                      {totals.walletBalances.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.calculatedBalance < 0 ? '-' : ''}Rp {Math.abs(w.calculatedBalance).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
                  </div>
                  {isEditBalanceInsufficient && (
                    <p className="mt-2 text-[11px] font-bold text-expense">
                      Saldo kurang. Sisa saldo setelah edit akan menjadi {fmt(editProjectedBalance)}.
                    </p>
                  )}
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Tanggal</label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10">
                    <Calendar size={16} strokeWidth={2.5} />
                  </div>
                  <input className="form-input pl-14 py-2.5 cursor-pointer text-sm w-full relative z-0"
                    type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                </div>
              </div>

              {editErr && (
                <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{editErr}</div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button onClick={handleSaveEdit} disabled={editBusy || isEditBalanceInsufficient}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                  editType === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
                }`}>
                {editBusy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Update Transaksi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
