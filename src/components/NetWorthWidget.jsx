import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmtShort, MONTHS } from '../lib/utils'
import { Landmark, TrendingUp, TrendingDown, Wallet, BriefcaseBusiness, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs shadow-lg pointer-events-none">
      <p className="text-muted text-[10px]">{label}</p>
      <p className="font-black text-text">{fmtShort(payload[0]?.value)}</p>
    </div>
  )
}

export default function NetWorthWidget() {
  const { txData, invData, walletData, billData, totals } = useData()

  const d = useMemo(() => {
    const now = new Date()

    const kasAset   = totals.walletBalances?.reduce((s, w) => s + Math.max(0, w.calculatedBalance || 0), 0) || 0
    const invAset   = Math.max(0, totals.invNet || 0)
    const totalAset = kasAset + invAset

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const overdueAmt = billData.filter(b => {
      if (b.is_lunas) return false
      const due = new Date(b.jatuh_tempo)
      due.setHours(0, 0, 0, 0)
      return due < today
    }).reduce((s, b) => s + (parseFloat(b.amount) || 0), 0)

    const netWorth = totalAset - overdueAmt

    const tren = Array.from({ length: 6 }, (_, i) => {
      const date  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const ym    = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const end   = `${ym}-31`
      const base  = walletData.reduce((s, w) => s + (Number(w.balance) || 0), 0)
      const cumIn  = txData.filter(t => t.type === 'in'  && t.date <= end).reduce((s, t) => s + t.amount, 0)
      const cumOut = txData.filter(t => t.type === 'out' && t.date <= end).reduce((s, t) => s + t.amount, 0)
      const iBuy  = invData.filter(t => t.action === 'beli' && t.date <= end).reduce((s, t) => s + t.amount, 0)
      const iSell = invData.filter(t => t.action === 'jual' && t.date <= end).reduce((s, t) => s + t.amount, 0)
      return { mo: MONTHS[date.getMonth()], nw: Math.max(0, base + cumIn - cumOut + Math.max(0, iBuy - iSell)) }
    })

    const prevNW   = tren[4]?.nw || 0
    const currNW   = tren[5]?.nw || 0
    const delta    = currNW - prevNW
    const deltaPct = prevNW > 0 ? ((delta / prevNW) * 100).toFixed(1) : null

    return { netWorth, kasAset, invAset, totalAset, overdueAmt, tren, delta, deltaPct }
  }, [txData, invData, walletData, billData, totals])

  const naik = d.delta >= 0

  const stats = [
    { icon: <Wallet size={14} />, label: 'Saldo Dompet', value: fmtShort(d.kasAset), color: '#10B981', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: <BriefcaseBusiness size={14} />, label: 'Investasi', value: fmtShort(d.invAset), color: '#4F46E5', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { icon: <AlertTriangle size={14} />, label: 'Tagihan Overdue', value: fmtShort(d.overdueAmt), color: d.overdueAmt > 0 ? '#EF4444' : '#10B981', bg: d.overdueAmt > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20' },
  ]

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">

      {/* Dark gradient hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Landmark size={17} className="text-slate-400" />
            <h2 className="font-bold text-sm text-slate-300">Kekayaan Bersih</h2>
          </div>
          {d.deltaPct !== null && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              naik ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {naik ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {naik ? '+' : ''}{d.deltaPct}% bln ini
            </span>
          )}
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-widest">Estimasi Total</p>
          <p className={`text-4xl font-black tabular-nums tracking-tight ${d.netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
            {fmtShort(d.netWorth)}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            Dompet + Investasi{d.overdueAmt > 0 ? ' − Tagihan overdue' : ''}
          </p>
        </div>

        {/* Mini chart di dalam hero */}
        <div className="relative z-10 mt-5 -mb-2">
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={d.tren} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id="nwHeroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mo" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="nw" stroke="#818cf8" strokeWidth={2}
                fill="url(#nwHeroGrad)" dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#818cf8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 stat chips */}
      <div className="p-5 grid grid-cols-3 gap-2.5">
        {stats.map(c => (
          <div key={c.label} className={`rounded-2xl p-3.5 flex flex-col gap-2 border ${c.bg}`}>
            <div style={{ color: c.color }}>{c.icon}</div>
            <p className="text-sm font-black tabular-nums leading-none" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[9px] font-semibold text-muted leading-tight">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
