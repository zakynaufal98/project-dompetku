import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  Gauge,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS } from '../lib/utils'
import { ProgressBar } from '../components/UI'

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

const moneyInput = (value, setter) => (
  {
    inputMode: 'numeric',
    value: value ? Number(value).toLocaleString('id-ID') : '',
    onChange: (e) => setter(e.target.value.replace(/\D/g, '')),
  }
)

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

  const selectedTarget = targetData.find((target) => target.id === selectedId) || targetData[0]

  useEffect(() => {
    if (!selectedId && targetData.length > 0) setSelectedId(targetData[0].id)
    if (selectedId && targetData.length > 0 && !targetData.some((target) => target.id === selectedId)) {
      setSelectedId(targetData[0].id)
    }
  }, [selectedId, targetData])

  useEffect(() => {
    if (!selectedTarget) {
      setTargetName('')
      setTargetAmount('')
      setCurrentSaved('')
      setMonthlyBoost('')
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
    if (result?.error) {
      setErr(result.error.message || 'Gagal menyimpan target')
      return
    }
    if (result?.data) setSelectedId(result.data.id)
  }

  const handleAddTarget = async () => {
    setBusy(true)
    setErr('')
    const result = await addTarget({
      name: 'Target Baru',
      amount: 10000000,
      saved: 0,
      monthlyBoost: 500000,
    })
    setBusy(false)
    if (result?.error) {
      setErr(result.error.message || 'Gagal membuat target')
      return
    }
    if (result?.data) setSelectedId(result.data.id)
  }

  const handleDeleteTarget = async () => {
    if (!selectedTarget) return
    setBusy(true)
    setErr('')
    const error = await deleteTarget(selectedTarget.id)
    setBusy(false)
    if (error) setErr(error.message || 'Gagal menghapus target')
  }

  const riskLabel = prediction.expenseTrend > 0.12 ? 'Pengeluaran naik' : prediction.predictedMonthly <= 0 ? 'Cashflow ketat' : 'Terkendali'
  const achievedLabel = prediction.predictedDate
    ? prediction.predictedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : 'Belum terprediksi'

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Target Cerdas</h1>
          <p className="text-muted text-sm font-medium mt-1">Kelola banyak target finansial dengan prediksi arus kas.</p>
        </div>
        <button onClick={handleAddTarget} disabled={busy} className="btn-primary w-fit">
          <Plus size={16} strokeWidth={2.5} />
          Target Baru
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-[24px] p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-text tracking-tight">Daftar Target</h2>
              <p className="text-xs font-medium text-muted">{targetData.length} target tersimpan</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-income-light text-income flex items-center justify-center">
              <Target size={20} strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1 custom-scrollbar">
            {targetSummaries.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  item.id === selectedTarget?.id
                    ? 'bg-income-light border-income/30'
                    : 'bg-bg border-border hover:border-border2'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-text truncate">{item.name}</p>
                    <p className="text-xs font-medium text-muted mt-0.5">Sisa {fmtShort(item.remaining)}</p>
                  </div>
                  <span className="text-[11px] font-black text-income tabular-nums">{Math.round(item.progress)}%</span>
                </div>
                <ProgressBar value={item.saved} max={item.amount || 1} color="#2196F3" />
                <p className="text-[11px] font-semibold text-muted mt-2">
                  {Number.isFinite(item.monthsNeeded) ? `${item.monthsNeeded} bulan lagi` : 'Belum bisa diprediksi'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm xl:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-income-light text-income flex items-center justify-center">
                <BrainCircuit size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-bold text-text tracking-tight">Detail Target</h2>
                <p className="text-xs font-medium text-muted">Edit angka lalu simpan perubahan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteTarget} disabled={busy || !selectedTarget} className="btn-secondary px-4 disabled:opacity-40">
                <Trash2 size={16} />
              </button>
              <button onClick={handleSaveTarget} disabled={busy} className="btn-primary px-4">{busy ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>

          {err && <div className="mb-4 text-xs text-expense bg-expense-light rounded-xl px-4 py-3 font-medium">{err}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nama Target</label>
              <input className="form-input rounded-xl" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Nominal Target</label>
              <input className="form-input rounded-xl tabular-nums" {...moneyInput(targetAmount, setTargetAmount)} />
            </div>
            <div>
              <label className="form-label">Dana Terkumpul</label>
              <input className="form-input rounded-xl tabular-nums" {...moneyInput(currentSaved, setCurrentSaved)} />
            </div>
            <div>
              <label className="form-label">Setoran Tambahan / Bulan</label>
              <input className="form-input rounded-xl tabular-nums" {...moneyInput(monthlyBoost, setMonthlyBoost)} />
            </div>
          </div>

          <div className="mt-6 bg-bg rounded-2xl p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{targetName || 'Target'}</p>
                <h2 className="text-3xl md:text-4xl font-black text-text tracking-tight tabular-nums">{fmt(remaining)}</h2>
                <p className="text-sm text-muted mt-2">Sisa dari target {fmt(target)}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 text-right">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Perkiraan Tercapai</p>
                <p className="font-black text-income mt-1">{achievedLabel}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-muted">Progress</span>
                <span className="text-text">{targetProgress.toFixed(1).replace('.', ',')}%</span>
              </div>
              <ProgressBar value={saved} max={target || 1} color="#2196F3" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<PiggyBank size={18} />} label="Potensi Nabung" value={fmtShort(prediction.predictedMonthly)} tone="income" />
        <MetricCard icon={<CalendarClock size={18} />} label="Durasi" value={Number.isFinite(prediction.monthsNeeded) ? `${prediction.monthsNeeded} bln` : '-'} tone="gold" />
        <MetricCard icon={<Gauge size={18} />} label="Keyakinan" value={`${Math.round(prediction.confidence)}%`} tone="invest" />
        <MetricCard icon={<TrendingUp size={18} />} label="Status" value={riskLabel} tone={riskLabel === 'Terkendali' ? 'invest' : 'expense'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-text tracking-tight">Proyeksi 12 Bulan</h2>
            <span className="text-[11px] font-bold text-muted bg-bg px-2 py-1 rounded-md uppercase tracking-wider">Dinamis</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prediction.projection} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196F3" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--chart-tick)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="saldo" name="Akumulasi" stroke="#2196F3" strokeWidth={3} fill="url(#targetGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-invest-light text-invest flex items-center justify-center">
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
            <Insight icon={<PiggyBank size={16} />} title="Saldo tersedia" text={`Saldo dompet saat ini terbaca ${fmtShort(totals?.saldo || 0)}. Gunakan sebagai batas aman, bukan angka wajib dipakai.`} />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-text tracking-tight">Perilaku Cashflow</h2>
          <span className="text-[11px] font-bold text-muted bg-bg px-2 py-1 rounded-md uppercase tracking-wider">9 Bulan</span>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyHistory} barGap={4} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={64} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgb(var(--color-bg) / 0.8)' }} />
              <Bar dataKey="masuk" name="Masuk" fill="#2196F3" radius={[5, 5, 0, 0]} maxBarSize={24} />
              <Bar dataKey="totalOut" name="Keluar" fill="#F5A623" radius={[5, 5, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, tone }) {
  const tones = {
    income: 'bg-income-light text-income',
    gold: 'bg-gold-light text-gold',
    invest: 'bg-invest-light text-invest',
    expense: 'bg-expense-light text-expense',
  }

  return (
    <div className="bg-surface border border-border rounded-[20px] p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${tones[tone]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="font-black text-text tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

function Insight({ icon, title, text }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-bg">
      <div className="w-8 h-8 rounded-lg bg-surface text-income flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="text-xs font-medium text-muted leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  )
}
