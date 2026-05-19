import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today, summarizeFinancialTx, QUICK_FILTERS, matchesQuickFilterPreset, isDateQuickFilterPreset } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader, BreakdownPanel } from '../components/UI'
import DescInput from '../components/DescInput'
import RecurringWidget from '../components/RecurringWidget'
import CategoryManager from '../components/CategoryManager'
import FinancialDefinitionsModal from '../components/FinancialDefinitionsModal'
import { isAndroidShell } from '../lib/platform'
import {
  ArrowDownLeft, ArrowUpRight, Banknote,
  Calendar, PlusCircle, ReceiptText, Loader2, Search,
  Wallet, ChevronDown, Sparkles, BriefcaseBusiness, ArrowUpDown, X, Check, SlidersHorizontal, BookOpen, ArrowLeft, ArrowRight
} from 'lucide-react'

function SectionToggle({ title, desc, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[20px] border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-bg"
      aria-expanded={open}
    >
      <div>
        <p className="text-sm font-black text-text">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-muted">{desc}</p>
      </div>
      <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

export default function Transaksi() {
  const androidShell = isAndroidShell()
  const location = useLocation()
  const navigate = useNavigate()
  const { txData, addTx, updateTx, deleteTx, totals, walletData, effectiveCategoryTree, addCustomCat, getProjectedWalletBalance } = useData()

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
  const [showCalcDetails, setShowCalcDetails] = useState(false)
  const [quickFilter, setQuickFilter] = useState('semua')
  const [showDefinitions, setShowDefinitions] = useState(false)
  const [showRecurringPanel, setShowRecurringPanel] = useState(false)
  const [activeDateKey, setActiveDateKey] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [composeStep, setComposeStep] = useState(1)

  const openAndroidComposer = () => {
    setComposeStep(1)
    const params = new URLSearchParams(location.search)
    params.set('compose', '1')
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false })
  }

  const closeAndroidComposer = () => {
    setComposeStep(1)
    const params = new URLSearchParams(location.search)
    if (params.get('compose') !== '1') {
      setShowAddModal(false)
      return
    }
    params.delete('compose')
    const search = params.toString()
    navigate({ pathname: location.pathname, search }, { replace: true })
  }

  useEffect(() => {
    if (walletData?.length > 0 && !walletId) setWalletId(walletData[0].id)
  }, [walletData, walletId])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setShowAddModal(params.get('compose') === '1')
  }, [location.search])

  useEffect(() => {
    if (!showAddModal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeAndroidComposer()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAddModal])

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

  const favoriteCategories = useMemo(() => {
    const map = {}
    txData
      .filter((t) => t.type === type && t.cat)
      .forEach((t) => {
        const key = `${t.cat}|||${t.sub_cat || ''}`
        if (!map[key]) map[key] = { cat: t.cat, subCat: t.sub_cat || '', count: 0, lastDate: t.date }
        map[key].count += 1
        if ((t.date || '') > (map[key].lastDate || '')) map[key].lastDate = t.date
      })

    return Object.values(map)
      .sort((a, b) => b.count - a.count || (b.lastDate || '').localeCompare(a.lastDate || ''))
      .slice(0, 5)
  }, [txData, type])

  const quickTemplates = useMemo(() => {
    const map = {}
    txData
      .filter((t) => t.type === type && t.cat && t.desc)
      .forEach((t) => {
        const key = `${t.desc}|||${t.cat}|||${t.sub_cat || ''}`
        if (!map[key]) {
          map[key] = {
            desc: t.desc,
            amount: t.amount,
            cat: t.cat,
            subCat: t.sub_cat || '',
            wallet_id: t.wallet_id || '',
            count: 0,
            lastDate: t.date,
          }
        }
        map[key].count += 1
        if ((t.date || '') >= (map[key].lastDate || '')) {
          map[key].amount = t.amount
          map[key].wallet_id = t.wallet_id || ''
          map[key].lastDate = t.date
        }
      })

    return Object.values(map)
      .sort((a, b) => b.count - a.count || (b.lastDate || '').localeCompare(a.lastDate || ''))
      .slice(0, 4)
  }, [txData, type])

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
    else {
      setDesc(''); setAmount(''); setMainCat(''); setSubCat(''); setType('out')
      setComposeStep(1)
      if (showAddModal) closeAndroidComposer()
    }
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

  const applyFavoriteCategory = (item) => {
    setMainCat(item.cat)
    setSubCat(item.subCat || '')
    setErr('')
  }

  const applyQuickTemplate = (item) => {
    setDesc(item.desc || '')
    setAmount(String(item.amount || ''))
    setMainCat(item.cat || '')
    setSubCat(item.subCat || '')
    if (item.wallet_id) setWalletId(item.wallet_id)
    setErr('')
  }

  // ── Filter / sort / group ──────────────────────────────
  const filtered = txData
    .filter(t => {
      const matchTab = filter === 'semua' || t.type === filter
      const matchMonth = isDateQuickFilterPreset(quickFilter) ? true : (selectedMonth ? t.date.startsWith(selectedMonth) : true)
      const matchQuickFilter = matchesQuickFilterPreset(t, quickFilter, new Date())
      const q = searchQuery.toLowerCase()
      const matchSearch = (t.desc?.toLowerCase().includes(q)) || (t.cat?.toLowerCase().includes(q))
      return matchTab && matchMonth && matchQuickFilter && matchSearch
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
    })
    Object.keys(groups).forEach((dateKey) => {
      const summary = summarizeFinancialTx(groups[dateKey].items)
      groups[dateKey].totalIn = summary.income
      groups[dateKey].totalOut = summary.expense
    })
    return groups
  }, [filtered])

  const visibleDateKeys = useMemo(() => Object.keys(groupedTx), [groupedTx])
  const sliderDateKeys = useMemo(() => [...visibleDateKeys].sort((a, b) => a.localeCompare(b)), [visibleDateKeys])
  const renderedDateKeys = useMemo(() => {
    if (!androidShell) return visibleDateKeys
    return activeDateKey && groupedTx[activeDateKey] ? [activeDateKey] : []
  }, [androidShell, visibleDateKeys, activeDateKey, groupedTx])

  useEffect(() => {
    if (!sliderDateKeys.length) {
      setActiveDateKey('')
      return
    }
    const todayKey = today()
    setActiveDateKey((prev) => {
      if (prev && sliderDateKeys.includes(prev)) return prev
      if (sliderDateKeys.includes(todayKey)) return todayKey
      return sliderDateKeys[sliderDateKeys.length - 1]
    })
  }, [sliderDateKeys])

  const monthlySummary = useMemo(() => {
    const monthTx = txData.filter((t) => {
      const matchMonth = isDateQuickFilterPreset(quickFilter) ? true : (!selectedMonth || t.date.startsWith(selectedMonth))
      return matchMonth && matchesQuickFilterPreset(t, quickFilter, new Date())
    })
    return summarizeFinancialTx(monthTx)
  }, [txData, selectedMonth, quickFilter])

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

  const addProjectedBalance = getProjectedWalletBalance({
    wallet_id: walletId,
    type,
    amount: +amount || 0
  })
  const editProjectedBalance = getProjectedWalletBalance({
    wallet_id: editWalletId,
    type: editType,
    amount: +editAmount || 0,
    originalTx: editedTx
  })
  const isAddBalanceInsufficient = type === 'out' && walletId && amount && addProjectedBalance < 0
  const isEditBalanceInsufficient = editType === 'out' && editWalletId && editAmount && editProjectedBalance < 0

  const formWarnings = useMemo(() => {
    const warnings = []
    const amountNum = Number(amount) || 0
    const lowerDesc = desc.trim().toLowerCase()

    if (type === 'in' && /gaji|bonus|tpp|tunjangan/.test(lowerDesc) && mainCat && mainCat !== 'Pemasukan Utama') {
      warnings.push('Transaksi ini terlihat seperti pendapatan utama. Biasanya lebih pas masuk kategori Pemasukan Utama.')
    }
    if (/transfer/.test(lowerDesc)) {
      warnings.push(type === 'out'
        ? 'Kalau ini pindah antar dompet, lebih aman dicatat lewat alur transfer agar tidak terbaca sebagai pengeluaran.'
        : 'Kalau ini hasil transfer antar dompet, jangan dihitung sebagai pemasukan riil.')
    }
    if (/pinjam|hutang|cicilan/.test(lowerDesc)) {
      warnings.push(type === 'in'
        ? 'Dana pinjaman akan menambah saldo, tapi tidak dihitung sebagai pemasukan riil.'
        : 'Pembayaran hutang akan terbaca sebagai kewajiban, bukan belanja operasional.')
    }
    if (type === 'out' && /invest|tabung|reksa|saham|emas|deposito/.test(lowerDesc)) {
      warnings.push('Kalau ini alokasi aset atau investasi, pertimbangkan catat lewat halaman investasi supaya laporan lebih rapi.')
    }
    if (mainCat === 'Lainnya' && lowerDesc.length >= 4) {
      warnings.push('Kategori masih "Lainnya". Kalau memungkinkan, pilih kategori yang lebih spesifik agar insight lebih akurat.')
    }
    if (type === 'out' && activeWallet?.calculatedBalance > 0 && amountNum >= activeWallet.calculatedBalance * 0.8) {
      warnings.push('Nominal ini cukup besar dibanding saldo dompet aktif. Cek lagi dompet, kategori, dan tujuan transaksi.')
    }

    return [...new Set(warnings)]
  }, [type, desc, amount, mainCat, activeWallet])

  const canProceedComposeStepOne = Boolean(desc.trim()) && Boolean(amount) && Number(amount) > 0

  const addFormBody = (
    <>
      {androidShell ? (
        <>
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Langkah {composeStep} dari 2
              </p>
              <h4 className="mt-1 text-base font-black tracking-tight text-text">
                {composeStep === 1 ? 'Detail utama' : 'Kategori & sumber dana'}
              </h4>
            </div>
            <div className="flex gap-2">
              <span className={`h-2.5 w-10 rounded-full ${composeStep === 1 ? 'bg-text' : 'bg-border'}`} />
              <span className={`h-2.5 w-10 rounded-full ${composeStep === 2 ? 'bg-text' : 'bg-border'}`} />
            </div>
          </div>

          {composeStep === 1 && (
            <>
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

              {quickTemplates.length > 0 && (
                <div className="rounded-[20px] border border-border bg-bg/60 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Template cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((item) => (
                      <button
                        key={`${item.desc}-${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyQuickTemplate(item)}
                        className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        <span className="max-w-[110px] truncate">{item.desc}</span>
                        <span className={type === 'in' ? 'text-income' : 'text-gold'}>{fmtShort(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Field label="Keterangan / Tempat">
                  <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={() => canProceedComposeStepOne && setComposeStep(2)} />
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
                      onKeyDown={e => e.key === 'Enter' && canProceedComposeStepOne && setComposeStep(2)}
                    />
                  </div>
                  {suggestedAmounts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5 animate-fade-in">
                      {suggestedAmounts.map((nominal, idx) => (
                        <button key={idx} type="button" onClick={() => setAmount(nominal.toString())}
                          className="px-2.5 py-1 bg-income-light text-income text-xs font-bold rounded-lg border border-income/20 hover:opacity-80 transition-opacity cursor-pointer shadow-sm active:scale-95">
                          {nominal.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                {err && <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{err}</div>}
              </div>
            </>
          )}

          {composeStep === 2 && (
            <div className="space-y-4">
              {favoriteCategories.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Kategori favorit</p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteCategories.map((item) => (
                      <button
                        key={`${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyFavoriteCategory(item)}
                        className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        {item.cat}{item.subCat ? ` • ${item.subCat}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              {formWarnings.length > 0 && (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest">Perlu dicek</p>
                  <div className="space-y-1.5">
                    {formWarnings.map((warning) => (
                      <p key={warning} className="text-xs font-medium leading-relaxed">{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              {err && <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{err}</div>}
            </div>
          )}
        </>
      ) : (
        <>
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

          {(quickTemplates.length > 0 || favoriteCategories.length > 0) && (
            <div className="space-y-3 rounded-[20px] border border-border bg-bg/60 p-4">
              {quickTemplates.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Template cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((item) => (
                      <button
                        key={`${item.desc}-${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyQuickTemplate(item)}
                        className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        <span className="max-w-[110px] truncate">{item.desc}</span>
                        <span className={type === 'in' ? 'text-income' : 'text-gold'}>{fmtShort(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {favoriteCategories.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Kategori favorit</p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteCategories.map((item) => (
                      <button
                        key={`${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyFavoriteCategory(item)}
                        className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        {item.cat}{item.subCat ? ` • ${item.subCat}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Keterangan / Tempat">
          <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={handleAdd} />
          <p className="text-[9px] text-income font-bold flex items-center mt-1.5 uppercase tracking-widest opacity-80">
            <Sparkles size={10} className="mr-1" /> Kategori dari riwayat aktif
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

      {formWarnings.length > 0 && (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest">Perlu dicek</p>
          <div className="space-y-1.5">
            {formWarnings.map((warning) => (
              <p key={warning} className="text-xs font-medium leading-relaxed">{warning}</p>
            ))}
          </div>
        </div>
      )}

      {err && <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{err}</div>}
        </>
      )}
    </>
  )

  const addModalActions = androidShell ? (
    composeStep === 1 ? (
      <button
        type="button"
        onClick={() => setComposeStep(2)}
        disabled={!canProceedComposeStepOne}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-text py-4 text-sm font-bold text-white transition-all disabled:opacity-40"
      >
        Lanjut
        <ArrowRight size={18} />
      </button>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setComposeStep(1)}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg py-4 text-sm font-bold text-text transition-colors hover:bg-border/70"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
        <button onClick={handleAdd} disabled={busy || isAddBalanceInsufficient}
          className={`flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all disabled:opacity-50 ${
            type === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
          }`}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          Simpan
        </button>
      </div>
    )
  ) : (
    <button onClick={handleAdd} disabled={busy || isAddBalanceInsufficient}
      className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 ${
        type === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
      }`}>
      {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
      Simpan Transaksi
    </button>
  )

  return (
    <div className={`animate-fade-up max-w-7xl mx-auto pb-10 ${androidShell ? 'space-y-4' : 'space-y-6'}`}>

      <header className="relative flex flex-col gap-5 rounded-[28px] bg-text p-7 text-white md:flex-row md:items-center md:justify-between md:p-9">
        <div className="relative z-10 flex items-start gap-4">
          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 md:flex">
            <ReceiptText size={22} className="text-white" />
          </div>
          <div>
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <Sparkles size={10} /> Arus Kas
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Transaksi</h1>
            <p className="mt-1.5 max-w-md text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Catat pemasukan, pengeluaran, dan riwayat harian.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setShowDefinitions(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
          >
            <BookOpen size={14} />
            Cara hitung
          </button>
        </div>
      </header>

      {!androidShell && (
        <div className="sticky top-4 z-30 hidden items-center justify-between gap-4 rounded-[22px] border border-border bg-surface/95 px-4 py-3 shadow-sm backdrop-blur lg:flex">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-pale text-text">
              <ReceiptText size={18} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-text">Transaksi</p>
              <p className="text-xs font-semibold text-muted">{filtered.length} transaksi tercatat</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDefinitions(true)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2.5 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
            >
              <BookOpen size={14} />
              Cara hitung
            </button>
            <button
              type="button"
              onClick={openAndroidComposer}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-black text-text shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
            >
              <PlusCircle size={15} />
              Tambah Transaksi
            </button>
          </div>
        </div>
      )}

      <div className={androidShell ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-5 gap-6'}>

        {/* ── ADD FORM PANEL ───────────────────────────────── */}
        <div className="hidden">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2ead4b, #054d28)' }}>
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

          {(quickTemplates.length > 0 || favoriteCategories.length > 0) && (
            <div className="space-y-3 rounded-[20px] border border-border bg-bg/60 p-4">
              {quickTemplates.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Template cepat</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((item) => (
                      <button
                        key={`${item.desc}-${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyQuickTemplate(item)}
                        className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        <span className="max-w-[110px] truncate">{item.desc}</span>
                        <span className={type === 'in' ? 'text-income' : 'text-gold'}>{fmtShort(item.amount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {favoriteCategories.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Kategori favorit</p>
                  <div className="flex flex-wrap gap-2">
                    {favoriteCategories.map((item) => (
                      <button
                        key={`${item.cat}-${item.subCat}`}
                        type="button"
                        onClick={() => applyFavoriteCategory(item)}
                        className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
                      >
                        {item.cat}{item.subCat ? ` • ${item.subCat}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Keterangan / Tempat">
              <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={handleAdd} />
              <p className="text-[9px] text-income font-bold flex items-center mt-1.5 uppercase tracking-widest opacity-80">
                <Sparkles size={10} className="mr-1" /> Kategori dari riwayat aktif
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

          {formWarnings.length > 0 && (
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest">Perlu dicek</p>
              <div className="space-y-1.5">
                {formWarnings.map((warning) => (
                  <p key={warning} className="text-xs font-medium leading-relaxed">{warning}</p>
                ))}
              </div>
            </div>
          )}

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
        <div className="lg:col-span-5 flex flex-col gap-4">
        <div className={`bg-surface border border-border rounded-[24px] shadow-sm flex flex-col ${androidShell ? 'p-4 md:p-6' : 'p-6 md:p-8'}`}>
          <PanelHeader title={selectedMonth ? "Ringkasan Bulan Ini" : "Ringkasan Semua Waktu"} sub="Statistik" />

          <div className="mt-2 space-y-3.5">
            <div className="bg-income/5 border border-income/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-income/10 hover:border-income/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-income-light text-income flex items-center justify-center shadow-inner"><ArrowDownLeft size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pemasukan</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Riil</span>
                </div>
              </div>
              <span className="text-income font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.realIncome)}</span>
            </div>

            <div className="bg-gold/5 border border-gold/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-gold/10 hover:border-gold/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gold-light text-gold flex items-center justify-center shadow-inner"><ArrowUpRight size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pengeluaran</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Bersih</span>
                </div>
              </div>
              <span className="text-gold font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.expense)}</span>
            </div>

            <div className="bg-invest/5 border border-invest/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-invest/10 hover:border-invest/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-invest-light text-invest flex items-center justify-center shadow-inner"><BriefcaseBusiness size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pencairan Investasi</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Uang masuk</span>
                </div>
              </div>
              <span className="text-invest font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.investmentLiquidation)}</span>
            </div>

            <div className="bg-income/5 border border-income/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-income/10 hover:border-income/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-income-light text-income flex items-center justify-center shadow-inner"><Sparkles size={22} strokeWidth={2.5} /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Profit Investasi</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Keuntungan</span>
                </div>
              </div>
              <span className="text-income font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.investmentProfit)}</span>
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

            <button
              type="button"
              onClick={() => setShowCalcDetails((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-bg px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-primary-pale"
              aria-expanded={showCalcDetails}
            >
              Lihat perhitungan
              <ChevronDown size={14} className={`transition-transform ${showCalcDetails ? 'rotate-180' : ''}`} />
            </button>

            {showCalcDetails && (
              <BreakdownPanel
                title={selectedMonth ? `Cara hitung ${selectedMonth}` : 'Cara hitung semua waktu'}
                note="Pemasukan riil dipisah dari pencairan dan profit investasi, jadi angka operasional harian lebih mudah dibaca."
                summary={monthlySummary}
              />
            )}
          </div>
        </div>
        </div>
      </div>

      {/* ── LIST RIWAYAT ────── */}
      <div className={`bg-surface border border-border rounded-[24px] shadow-sm transition-colors ${androidShell ? 'p-4 md:p-6' : 'p-6 md:p-8'}`}>
        <PanelHeader title="Riwayat Transaksi" sub="Histori" badge={`${filtered.length} transaksi`} />

        {androidShell && sliderDateKeys.length > 1 && (
          <div className="mb-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Tanggal</p>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {sliderDateKeys.map((dateKey) => (
                <button
                  key={`jump-${dateKey}`}
                  type="button"
                  onClick={() => setActiveDateKey(dateKey)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                    activeDateKey === dateKey
                      ? 'bg-text text-white'
                      : 'border border-border bg-surface text-text hover:bg-bg'
                  }`}
                >
                  {getDayLabel(dateKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        {!androidShell && (
        <div className="mb-4 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {QUICK_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setQuickFilter(item.value)}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                quickFilter === item.value
                  ? 'bg-text text-white'
                  : 'border border-border bg-surface text-text hover:bg-bg'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        )}

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
            className="w-full bg-field border border-border2 text-text placeholder:text-muted2 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-text focus:bg-surface outline-none transition-all" />
        </div>

        <div className="lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedTx).length > 0 ? (
            renderedDateKeys.map(dateKey => {
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

      {androidShell ? (
        <div className="space-y-3">
          <SectionToggle
            title="Transaksi berulang"
            desc="Buka saat perlu supaya halaman Android tetap terasa ringkas."
            open={showRecurringPanel}
            onClick={() => setShowRecurringPanel((prev) => !prev)}
          />
          {showRecurringPanel && <RecurringWidget />}
        </div>
      ) : (
        <RecurringWidget />
      )}

      {showAddModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/55 backdrop-blur-sm animate-fade-in sm:items-center sm:px-6"
          onClick={closeAndroidComposer}
        >
          <div
            className="flex max-h-[92dvh] w-full flex-col rounded-t-[32px] border border-border bg-surface shadow-2xl sm:max-h-[88vh] sm:max-w-4xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{ background: 'linear-gradient(135deg, #2ead4b, #054d28)' }}
                >
                  <ReceiptText size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Form</p>
                  <h3 className="truncate text-base font-black tracking-tight text-text">Tambah Transaksi</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAndroidComposer}
                aria-label="Tutup form tambah transaksi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg text-muted2 transition-colors hover:text-expense"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar sm:p-6">
              {addFormBody}
            </div>
            <div className="shrink-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
              {addModalActions}
            </div>
          </div>
        </div>,
        document.body
      )}

      <FinancialDefinitionsModal open={showDefinitions} onClose={() => setShowDefinitions(false)} />

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
