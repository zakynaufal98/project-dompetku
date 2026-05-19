import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Calendar,
  Check,
  ChevronDown,
  Loader2,
  PlusCircle,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today } from '../lib/utils'
import { Field } from './UI'
import DescInput from './DescInput'
import CategoryManager from './CategoryManager'

export const OPEN_GLOBAL_TRANSACTION_COMPOSER = 'cashflowku:open-transaction-composer'

export const openGlobalTransactionComposer = () => {
  window.dispatchEvent(new Event(OPEN_GLOBAL_TRANSACTION_COMPOSER))
}

export default function GlobalTransactionComposer() {
  const { txData, addTx, totals, walletData, effectiveCategoryTree, addCustomCat, getProjectedWalletBalance } = useData()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [type, setType] = useState('out')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [mainCat, setMainCat] = useState('')
  const [subCat, setSubCat] = useState('')
  const [date, setDate] = useState(today())
  const [walletId, setWalletId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showCatManager, setShowCatManager] = useState(false)
  const [showAddCatForm, setShowAddCatForm] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [newCatBusy, setNewCatBusy] = useState(false)

  useEffect(() => {
    const handler = () => {
      setStep(1)
      setOpen(true)
    }
    window.addEventListener(OPEN_GLOBAL_TRANSACTION_COMPOSER, handler)
    return () => window.removeEventListener(OPEN_GLOBAL_TRANSACTION_COMPOSER, handler)
  }, [])

  useEffect(() => {
    if (walletData?.length > 0 && !walletId) setWalletId(walletData[0].id)
  }, [walletData, walletId])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const availableMainCats = Object.keys(effectiveCategoryTree?.[type] || {})
  const availableSubCats = mainCat && effectiveCategoryTree?.[type]?.[mainCat] ? effectiveCategoryTree[type][mainCat] : []
  const activeWallet = totals?.walletBalances?.find(w => w.id === walletId)
  const projectedBalance = getProjectedWalletBalance({
    wallet_id: walletId,
    type,
    amount: +amount || 0,
  })
  const isBalanceInsufficient = type === 'out' && walletId && amount && projectedBalance < 0
  const canProceedStepOne = Boolean(desc.trim()) && Boolean(amount) && Number(amount) > 0

  const quickTemplates = useMemo(() => {
    const map = {}
    txData
      .filter((t) => t.type === type && t.cat && t.desc)
      .forEach((t) => {
        const key = `${t.desc}|||${t.cat}|||${t.sub_cat || ''}`
        if (!map[key]) {
          map[key] = { desc: t.desc, amount: t.amount, cat: t.cat, subCat: t.sub_cat || '', wallet_id: t.wallet_id || '', count: 0, lastDate: t.date }
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

  const handleTypeChange = (newType) => {
    setType(newType)
    setMainCat('')
    setSubCat('')
    setShowAddCatForm(false)
    setNewCatInput('')
    setErr('')
  }

  const handleDescChange = (value) => {
    setDesc(value)
    setErr('')
    if (value.trim().length > 2) {
      const pastMatch = txData.find(t => t.desc?.toLowerCase() === value.trim().toLowerCase())
      if (pastMatch?.cat) {
        setType(pastMatch.type)
        setMainCat(pastMatch.cat)
        setSubCat(pastMatch.sub_cat || '')
      }
    }
  }

  const handleSaveNewCat = async () => {
    if (!newCatInput.trim()) return
    setNewCatBusy(true)
    const error = await addCustomCat(type, newCatInput.trim(), [])
    setNewCatBusy(false)
    if (!error) {
      setMainCat(newCatInput.trim())
      setSubCat('')
      setNewCatInput('')
      setShowAddCatForm(false)
    }
  }

  const applyQuickTemplate = (item) => {
    setDesc(item.desc || '')
    setAmount(String(item.amount || ''))
    setMainCat(item.cat || '')
    setSubCat(item.subCat || '')
    if (item.wallet_id) setWalletId(item.wallet_id)
    setErr('')
  }

  const applyFavoriteCategory = (item) => {
    setMainCat(item.cat)
    setSubCat(item.subCat || '')
    setErr('')
  }

  const resetForm = () => {
    setDesc('')
    setAmount('')
    setMainCat('')
    setSubCat('')
    setType('out')
    setDate(today())
    setStep(1)
    setErr('')
  }

  const handleAdd = async () => {
    if (!desc.trim()) { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount <= 0) { setErr('Jumlah harus lebih dari 0'); return }
    if (!mainCat) { setErr('Kategori Induk wajib dipilih'); return }
    if (availableSubCats.length > 0 && !subCat) { setErr('Sub kategori wajib dipilih'); return }
    if (isBalanceInsufficient) {
      setErr(`Saldo ${activeWallet?.name || 'dompet'} tidak mencukupi. Sisa saldo: ${fmt(activeWallet?.calculatedBalance || 0)}`)
      return
    }

    setBusy(true)
    setErr('')
    const error = await addTx({
      desc: desc.trim(),
      amount: +amount,
      type,
      cat: mainCat,
      sub_cat: subCat,
      date,
      wallet_id: walletId || null,
    })
    setBusy(false)
    if (error) {
      setErr(error.message || 'Gagal menyimpan transaksi')
      return
    }

    resetForm()
    setOpen(false)
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/55 backdrop-blur-sm animate-fade-in sm:items-center sm:px-6"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col rounded-t-[32px] border border-border bg-surface shadow-2xl sm:max-h-[88vh] sm:max-w-3xl sm:rounded-[32px]"
        onClick={(event) => event.stopPropagation()}
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
            onClick={() => setOpen(false)}
            aria-label="Tutup form tambah transaksi"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg text-muted2 transition-colors hover:text-expense"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar sm:p-6">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Langkah {step} dari 2</p>
              <h4 className="mt-1 text-base font-black tracking-tight text-text">
                {step === 1 ? 'Detail utama' : 'Kategori & sumber dana'}
              </h4>
            </div>
            <div className="flex gap-2">
              <span className={`h-2.5 w-10 rounded-full ${step === 1 ? 'bg-text' : 'bg-border'}`} />
              <span className={`h-2.5 w-10 rounded-full ${step === 2 ? 'bg-text' : 'bg-border'}`} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleTypeChange('in')}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl border py-3.5 text-sm font-bold transition-all ${
                    type === 'in' ? 'bg-income-light text-income border-income/30' : 'bg-bg text-muted border-transparent hover:border-border2'
                  }`}>
                  <ArrowDownLeft size={18} strokeWidth={2.5} /> Pemasukan
                </button>
                <button onClick={() => handleTypeChange('out')}
                  className={`flex items-center justify-center gap-2.5 rounded-2xl border py-3.5 text-sm font-bold transition-all ${
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

              <Field label="Keterangan / Tempat">
                <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={() => canProceedStepOne && setStep(2)} />
                <p className="mt-1.5 flex items-center text-[9px] font-bold uppercase tracking-widest text-income opacity-80">
                  <Sparkles size={10} className="mr-1" /> Kategori dari riwayat aktif
                </p>
              </Field>

              <Field label="Jumlah (Rp)">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-bg text-muted pointer-events-none">
                    <Banknote size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    className="form-input relative z-0 py-3 pl-14"
                    type="text"
                    inputMode="numeric"
                    value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                    onChange={e => { setAmount(e.target.value.replace(/\D/g, '')); setErr('') }}
                    placeholder="0"
                    onKeyDown={e => e.key === 'Enter' && canProceedStepOne && setStep(2)}
                  />
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
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
                        {item.cat}{item.subCat ? ` - ${item.subCat}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-xs font-bold text-muted">Kategori Induk</label>
                  <button
                    type="button"
                    onClick={() => setShowCatManager(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-teal-500 transition-colors hover:text-teal-400"
                  >
                    <SlidersHorizontal size={11} /> Kelola
                  </button>
                </div>
                <div className="relative">
                  <select
                    className="form-input w-full cursor-pointer appearance-none py-3 pl-4 pr-10 text-sm font-semibold text-text-2"
                    value={mainCat}
                    onChange={e => {
                      if (e.target.value === '__add__') { setShowAddCatForm(true); return }
                      setMainCat(e.target.value)
                      setSubCat('')
                      setShowAddCatForm(false)
                    }}
                  >
                    <option value="" disabled>Pilih Kategori...</option>
                    {availableMainCats.map(c => <option key={c} value={c}>{c}</option>)}
                    <option disabled>--------------</option>
                    <option value="__add__">+ Tambah Kategori Baru</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </div>
                {showAddCatForm && (
                  <div className="flex gap-2 animate-fade-in">
                    <input
                      className="form-input flex-1 py-2 text-sm"
                      placeholder="Nama kategori baru..."
                      value={newCatInput}
                      onChange={e => setNewCatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveNewCat(); if (e.key === 'Escape') { setShowAddCatForm(false); setNewCatInput('') } }}
                      autoFocus
                    />
                    <button onClick={handleSaveNewCat} disabled={newCatBusy}
                      className="rounded-xl bg-teal-500 px-3 text-white transition-colors hover:bg-teal-600 disabled:opacity-50">
                      {newCatBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button onClick={() => { setShowAddCatForm(false); setNewCatInput('') }}
                      className="rounded-xl bg-bg px-3 text-muted transition-colors hover:text-text">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <Field label="Sub Kategori">
                <div className="relative">
                  <select
                    className="form-input w-full cursor-pointer appearance-none py-3 pl-4 pr-10 text-sm font-semibold text-text-2 disabled:opacity-50"
                    value={subCat}
                    onChange={e => setSubCat(e.target.value)}
                    disabled={!mainCat || availableSubCats.length === 0}
                  >
                    <option value="" disabled>Pilih Detail...</option>
                    {availableSubCats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </Field>

              <Field label="Pilih Dompet / Rekening">
                {totals?.walletBalances?.length > 0 ? (
                  <div className="relative">
                    <div
                      className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white pointer-events-none"
                      style={{ backgroundColor: activeWallet?.color || '#94a3b8' }}
                    >
                      <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <select
                      className="form-input w-full cursor-pointer appearance-none py-3 pl-14 pr-10 font-semibold text-text-2"
                      value={walletId}
                      onChange={e => setWalletId(e.target.value)}
                    >
                      <option value="" disabled>Pilih Sumber Dana...</option>
                      {totals.walletBalances.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} - {w.calculatedBalance < 0 ? '-' : ''}Rp {Math.abs(w.calculatedBalance).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-muted">
                    <Wallet size={16} className="text-slate-400" /> Belum ada dompet. Buat di Dashboard!
                  </div>
                )}
                {isBalanceInsufficient && (
                  <p className="mt-2 text-[11px] font-bold text-expense">
                    Saldo kurang. Maksimal pengeluaran dari dompet ini {fmt(activeWallet?.calculatedBalance || 0)}.
                  </p>
                )}
              </Field>

              <Field label="Tanggal">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-bg text-muted pointer-events-none">
                    <Calendar size={16} strokeWidth={2.5} />
                  </div>
                  <input
                    className="form-input relative z-0 cursor-pointer py-3 pl-14 text-sm"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </Field>
            </div>
          )}

          {err && (
            <div className="rounded-xl border border-expense/20 bg-expense-light px-4 py-3 text-xs font-medium text-expense">
              {err}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStepOne}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-text py-4 text-sm font-bold text-white transition-all disabled:opacity-40"
            >
              Lanjut
              <ArrowRight size={18} />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg py-4 text-sm font-bold text-text transition-colors hover:bg-border/70"
              >
                <ArrowLeft size={18} />
                Kembali
              </button>
              <button
                onClick={handleAdd}
                disabled={busy || isBalanceInsufficient}
                className={`flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all disabled:opacity-50 ${
                  type === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
                }`}
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                Simpan
              </button>
            </div>
          )}
        </div>
      </div>

      <CategoryManager
        open={showCatManager}
        onClose={() => setShowCatManager(false)}
        type={type}
      />
    </div>,
    document.body
  )
}
