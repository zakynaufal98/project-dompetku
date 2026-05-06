import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  BadgeCheck, BrainCircuit, CalendarClock, Check,
  Gauge, PiggyBank, Plus, Sparkles, Target, Trash2, TrendingUp, X,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS } from '../lib/utils'
import { ProgressBar, MetricCard, Insight } from '../components/UI'

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const addMonths = (date, count) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + count)
  return d
}

const monthLabel = (ym) => {
  const [year, month] = ym.split('-').map(Number)
  return `${MONTHS[month - 1]} ${year}`
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const avg = (items) => items.length ? items.reduce((sum, n) => sum + n, 0) / items.length : 0

const moneyInput = (value, setter) => ({
  inputMode: 'numeric',
  value: value ? Number(value).toLocaleString('id-ID') : '',
  onChange: (e) => setter(e.target.value.replace(/\D/g, '')),
})

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="text-muted font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function buildPrediction({ monthlyHistory, plannedBoost, remaining, saved, target }) {
  const usable = monthlyHistory.filter((m) => m.masuk > 0 || m.totalOut > 0)
  const recent = usable.slice(-6)
  const savings = recent.map((m) => m.saving)
  const expenses = recent.map((m) => m.totalOut)
  const income = recent.map((m) => m.masuk)

  const weightedSaving = savings.length
    ? savings.reduce((sum, n, i) => sum + n * (i + 1), 0) / savings.reduce((sum, _, i) => sum + i + 1, 0)
    : 0
  const savingTrend = savings.length >= 2 ? (savings[savings.length - 1] - savings[0]) / (savings.length - 1) : 0
  const expenseTrend = expenses.length >= 2 ? (expenses[expenses.length - 1] - expenses[0]) / Math.max(1, expenses[0]) : 0
  const volatility = savings.length ? avg(savings.map((n) => Math.abs(n - avg(savings)))) : 0
  const predictedMonthly = Math.max(0, weightedSaving + savingTrend * 0.35 + plannedBoost)
  const monthsNeeded = remaining <= 0 ? 0 : predictedMonthly > 0 ? Math.ceil(remaining / predictedMonthly) : Infinity
  const confidence = clamp(
    92 - (volatility / Math.max(1, Math.abs(weightedSaving) + plannedBoost)) * 36 - Math.abs(expenseTrend) * 14,
    usable.length >= 3 ? 48 : 32,
    94
  )

  const projection = []
  let balance = saved
  for (let i = 0; i < 12; i++) {
    const projectedDate = addMonths(new Date(), i + 1)
    const drift = savingTrend * Math.min(i, 5) * 0.15
    const projectedSaving = Math.max(0, weightedSaving + plannedBoost + drift)
    balance = Math.min(target || balance + projectedSaving, balance + projectedSaving)
    projection.push({
      label: monthLabel(monthKey(projectedDate)),
      saldo: Math.round(balance),
      setoran: Math.round(projectedSaving),
    })
  }

  return {
    avgIncome: avg(income),
    avgExpense: avg(expenses),
    weightedSaving,
    predictedMonthly,
    monthsNeeded,
    predictedDate: Number.isFinite(monthsNeeded) ? addMonths(new Date(), monthsNeeded) : null,
    confidence,
    projection,
    idealMonthly: remaining > 0 ? Math.ceil(remaining / 12) : 0,
    expenseTrend,
  }
}

export default function TargetCerdas() {
  const { txData, invData, totals, targetData, addTarget, updateTarget, deleteTarget } = useData()
  const [selectedId, setSelectedId] = useState('')
  const [targetName, setTargetName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentSaved, setCurrentSaved] = useState('')
  const [monthlyBoost, setMonthlyBoost] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const selectedTarget = targetData.find((t) => t.id === selectedId) || targetData[0]

  useEffect(() => {
    if (!selectedId && targetData.length > 0) setSelectedId(targetData[0].id)
    if (selectedId && targetData.length > 0 && !targetData.some((t) => t.id === selectedId)) {
      setSelectedId(targetData[0].id)
    }
  }, [selectedId, targetData])

  useEffect(() => {
    if (!selectedTarget) {
      setTargetName(''); setTargetAmount(''); setCurrentSaved(''); setMonthlyBoost('')
      return
    }
    setTargetName(selectedTarget.name || '')
    setTargetAmount(String(selectedTarget.amount || ''))
    setCurrentSaved(String(selectedTarget.saved || ''))
    setMonthlyBoost(String(selectedTarget.monthlyBoost || ''))
  }, [selectedTarget?.id])

  const monthlyHistory = useMemo(() => {
    const rows = new Map()
    const ensure = (ym) => {
      if (!rows.has(ym)) rows.set(ym, { ym, masuk: 0, keluar: 0, invest: 0 })
      return rows.get(ym)
    }
    txData.forEach((t) => {
      if (!t.date || t.cat === 'Transfer') return
      const row = ensure(t.date.slice(0, 7))
      if (t.type === 'in') row.masuk += t.amount
      if (t.type === 'out') row.keluar += t.amount
    })
    invData.forEach((t) => {
      if (!t.date) return
      const row = ensure(t.date.slice(0, 7))
      if (t.action === 'beli') row.invest += t.amount
      if (t.action === 'jual') row.masuk += t.amount
    })
    const now = new Date()
    for (let i = 8; i >= 0; i--) ensure(monthKey(addMonths(now, -i)))
    return [...rows.values()]
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .slice(-9)
      .map((row, index, arr) => {
        const saving = row.masuk - row.keluar - row.invest
        const prev = arr[index - 1]
        const prevOut = prev ? prev.keluar + prev.invest : row.keluar + row.invest
        return {
          ...row,
          label: monthLabel(row.ym),
          saving,
          totalOut: row.keluar + row.invest,
          spendingChange: prevOut ? ((row.keluar + row.invest) - prevOut) / prevOut : 0,
        }
      })
  }, [txData, invData])

  const target = Number(targetAmount) || 0
  const saved = Number(currentSaved) || 0
  const plannedBoost = Number(monthlyBoost) || 0
  const remaining = Math.max(0, target - saved)
  const targetProgress = target > 0 ? clamp((saved / target) * 100, 0, 100) : 0
  const prediction = useMemo(
    () => buildPrediction({ monthlyHistory, plannedBoost, remaining, saved, target }),
    [monthlyHistory, plannedBoost, remaining, saved, target]
  )

  const targetSummaries = useMemo(() => targetData.map((item) => {
    const itemTarget = Number(item.amount) || 0
    const itemSaved = Number(item.saved) || 0
    const itemRemaining = Math.max(0, itemTarget - itemSaved)
    const itemPrediction = buildPrediction({
      monthlyHistory,
      plannedBoost: Number(item.monthlyBoost) || 0,
      remaining: itemRemaining,
      saved: itemSaved,
      target: itemTarget,
    })
    return {
      ...item,
      remaining: itemRemaining,
      progress: itemTarget > 0 ? clamp((itemSaved / itemTarget) * 100, 0, 100) : 0,
      monthsNeeded: itemPrediction.monthsNeeded,
    }
  }), [targetData, monthlyHistory])

  const handleCloseModal = () => {
    setIsEditOpen(false)
    setConfirmDelete(false)
    setErr('')
  }

  const handleSelectTarget = (id) => {
    setSelectedId(id)
    setConfirmDelete(false)
    setErr('')
    setIsEditOpen(true)
  }

  const handleSaveTarget = async () => {
    const payload = {
      name: targetName.trim() || 'Target Baru',
      amount: target,
      saved,
      monthlyBoost: plannedBoost,
    }
    setBusy(true)
    setErr('')
    const result = selectedTarget
      ? await updateTarget(selectedTarget.id, payload)
      : await addTarget(payload)
    setBusy(false)
    if (result?.error) { setErr(result.error.message || 'Gagal menyimpan target'); return }
    if (result?.data) setSelectedId(result.data.id)
    handleCloseModal()
  }

  const handleAddTarget = async () => {
    setBusy(true)
    setErr('')
    const result = await addTarget({ name: 'Target Baru', amount: 10000000, saved: 0, monthlyBoost: 500000 })
    setBusy(false)
    if (result?.error) { setErr(result.error.message || 'Gagal membuat target'); return }
    if (result?.data) { setSelectedId(result.data.id); setIsEditOpen(true) }
  }

  const handleDeleteTarget = async () => {
    if (!selectedTarget) return
    setBusy(true)
    setErr('')
    const error = await deleteTarget(selectedTarget.id)
    setBusy(false)
    if (error) { setErr(error.message || 'Gagal menghapus target'); return }
    handleCloseModal()
  }

  const riskLabel = prediction.expenseTrend > 0.12 ? 'Pengeluaran naik' : prediction.predictedMonthly <= 0 ? 'Cashflow ketat' : 'Terkendali'
  const achievedLabel = prediction.predictedDate
    ? prediction.predictedDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    : 'Belum terprediksi'

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl text-text tracking-tight">Target Cerdas</h1>
          <p className="text-muted text-sm font-medium mt-1">Kelola target finansial dengan prediksi arus kas.</p>
        </div>
        <button onClick={handleAddTarget} disabled={busy} className="btn-primary w-fit">
          <Plus size={16} strokeWidth={2.5} /> Target Baru
        </button>
      </div>

      {/* Target Cards — full width, responsive grid */}
      <div className="bg-surface border border-border rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-text">Daftar Target</h2>
            <p className="text-xs text-muted font-medium mt-0.5">{targetData.length} target • Ketuk untuk edit</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-income-light text-income flex items-center justify-center">
            <Target size={20} strokeWidth={2.5} />
          </div>
        </div>

        {targetData.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-income-light text-income flex items-center justify-center mx-auto mb-3">
              <Target size={24} />
            </div>
            <p className="text-sm font-bold text-text">Belum ada target</p>
            <p className="text-xs text-muted mt-1">Klik "Target Baru" untuk memulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {targetSummaries.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectTarget(item.id)}
                className={`text-left rounded-2xl border p-4 transition-all hover:border-income/40 ${
                  item.id === selectedTarget?.id
                    ? 'bg-income-light border-income/30'
                    : 'bg-bg border-border hover:border-border2'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-text truncate text-sm">{item.name}</p>
                    <p className="text-xs font-medium text-muted mt-0.5">Sisa {fmtShort(item.remaining)}</p>
                  </div>
                  <span className="text-[11px] font-black text-income tabular-nums shrink-0 bg-income/10 px-1.5 py-0.5 rounded-md">
                    {Math.round(item.progress)}%
                  </span>
                </div>
                <ProgressBar value={item.saved} max={item.amount || 1} color="#2196F3" />
                <p className="text-[11px] font-semibold text-muted mt-2">
                  {Number.isFinite(item.monthsNeeded) ? `${item.monthsNeeded} bulan lagi` : 'Belum bisa diprediksi'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<PiggyBank size={18} />} label="Potensi Nabung" value={fmtShort(prediction.predictedMonthly)} tone="income" />
        <MetricCard icon={<CalendarClock size={18} />} label="Durasi" value={Number.isFinite(prediction.monthsNeeded) ? `${prediction.monthsNeeded} bln` : '-'} tone="gold" />
        <MetricCard icon={<Gauge size={18} />} label="Keyakinan" value={`${Math.round(prediction.confidence)}%`} tone="invest" />
        <MetricCard icon={<TrendingUp size={18} />} label="Status" value={riskLabel} tone={riskLabel === 'Terkendali' ? 'invest' : 'expense'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm xl:col-span-3 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-text tracking-tight">Proyeksi 12 Bulan</h2>
            <span className="text-[11px] font-bold text-muted bg-bg px-2 py-1 rounded-md uppercase tracking-wider">Dinamis</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prediction.projection} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="saldo" name="Akumulasi" stroke="#2196F3" strokeWidth={3} fill="url(#targetGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm xl:col-span-2 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-invest-light text-invest flex items-center justify-center transition-colors">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-bold text-text tracking-tight">Saran Cerdas</h2>
              <p className="text-xs font-medium text-muted">Berbasis histori terakhir</p>
            </div>
          </div>
          <div className="space-y-4">
            <Insight icon={<BadgeCheck size={16} />} title="Setoran ideal" text={`Agar tercapai dalam 12 bulan, siapkan sekitar ${fmtShort(prediction.idealMonthly)} per bulan.`} />
            <Insight icon={<TrendingUp size={16} />} title="Ruang cashflow" text={`Rata-rata pemasukan ${fmtShort(prediction.avgIncome)} dan pengeluaran ${fmtShort(prediction.avgExpense)} per bulan.`} />
            <Insight icon={<PiggyBank size={16} />} title="Saldo tersedia" text={`Saldo dompet saat ini ${fmtShort(totals?.saldo || 0)}. Gunakan sebagai batas aman.`} />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-text tracking-tight">Perilaku Cashflow</h2>
          <span className="text-[11px] font-bold text-muted bg-bg px-2 py-1 rounded-md uppercase tracking-wider">9 Bulan</span>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyHistory} barGap={4} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--color-bg) / 0.8)' }} />
              <Bar dataKey="masuk" name="Masuk" fill="#2196F3" radius={[5, 5, 0, 0]} maxBarSize={24} />
              <Bar dataKey="totalOut" name="Keluar" fill="#F5A623" radius={[5, 5, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Edit Modal — bottom sheet on mobile, centered on desktop */}
      {isEditOpen && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="bg-surface w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] border border-border shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-text">Edit Target</h3>
                <p className="text-xs text-muted mt-0.5">Ubah detail lalu simpan</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-muted2 hover:text-expense transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {err && (
                <div className="text-xs text-expense bg-expense-light rounded-xl px-4 py-3 font-medium">{err}</div>
              )}

              <div>
                <label className="form-label">Nama Target</label>
                <input className="form-input rounded-xl" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Nominal Target</label>
                  <input className="form-input rounded-xl tabular-nums" {...moneyInput(targetAmount, setTargetAmount)} />
                </div>
                <div>
                  <label className="form-label">Dana Terkumpul</label>
                  <input className="form-input rounded-xl tabular-nums" {...moneyInput(currentSaved, setCurrentSaved)} />
                </div>
              </div>

              <div>
                <label className="form-label">Setoran Tambahan / Bulan</label>
                <input className="form-input rounded-xl tabular-nums" {...moneyInput(monthlyBoost, setMonthlyBoost)} />
              </div>

              {/* Progress Summary */}
              <div className="bg-bg rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Sisa Target</p>
                    <p className="text-2xl font-black text-text tabular-nums leading-none">{fmtShort(remaining)}</p>
                    <p className="text-xs text-muted mt-1">dari {fmtShort(target)}</p>
                  </div>
                  <div className="bg-surface rounded-xl px-3 py-2 text-right shrink-0">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Prediksi</p>
                    <p className="font-black text-income text-sm mt-0.5">{achievedLabel}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted">Progress</span>
                  <span className="text-text">{targetProgress.toFixed(1).replace('.', ',')}%</span>
                </div>
                <ProgressBar value={saved} max={target || 1} color="#2196F3" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex items-center gap-2 shrink-0">
              {confirmDelete ? (
                <div className="flex items-center gap-2 animate-fade-in flex-1">
                  <span className="text-xs font-bold text-expense flex-1">Yakin hapus target ini?</span>
                  <button
                    onClick={handleDeleteTarget}
                    disabled={busy}
                    className="w-8 h-8 bg-expense text-white rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-40"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="w-8 h-8 bg-border text-muted rounded-full flex items-center justify-center hover:bg-border2"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                    className="btn-secondary px-3 disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={handleSaveTarget}
                    disabled={busy}
                    className="btn-primary flex-1"
                  >
                    {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
