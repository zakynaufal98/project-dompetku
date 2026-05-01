import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmtShort, MONTHS } from '../lib/utils'
import { Landmark, TrendingUp, TrendingDown, Wallet, BriefcaseBusiness, ShieldCheck } from 'lucide-react'
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

    const kasAset  = totals.walletBalances?.reduce((s, w) => s + Math.max(0, w.calculatedBalance || 0), 0) || 0
    const invAset  = Math.max(0, totals.invNet || 0)
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

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={17} className="text-primary" />
          <h2 className="font-bold text-sm text-text">Kekayaan Bersih</h2>
        </div>
        {d.deltaPct !== null && (
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            naik ? 'bg-income-light text-income' : 'bg-expense-light text-expense'
          }`}>
            {naik ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {naik ? '+' : ''}{d.deltaPct}% bln ini
          </span>
        )}
      </div>

      {/* Angka Utama */}
      <div>
        <p className="text-[10px] font-semibold text-muted mb-1">Estimasi Kekayaan Bersih</p>
        <p className={`text-3xl font-black tabular-nums tracking-tight ${d.netWorth >= 0 ? 'text-text' : 'text-expense'}`}>
          {fmtShort(d.netWorth)}
        </p>
        <p className="text-xs text-muted mt-1">Dompet + Investasi{d.overdueAmt > 0 ? ' − Tagihan overdue' : ''}</p>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* 3 chips — semua tampilan identik, hanya warna berbeda */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <Wallet size={13} />,
            label: 'Saldo Dompet',
            value: fmtShort(d.kasAset),
            color: '#10B981',
            alpha: '1a',   // hex opacity 10%
          },
          {
            icon: <BriefcaseBusiness size={13} />,
            label: 'Investasi',
            value: fmtShort(d.invAset),
            color: '#4F46E5',
            alpha: '1a',
          },
          {
            icon: <ShieldCheck size={13} />,
            label: 'Tagihan Overdue',
            value: fmtShort(d.overdueAmt),
            color: d.overdueAmt > 0 ? '#EF4444' : '#10B981',
            alpha: '1a',
          },
        ].map(c => (
          <div
            key={c.label}
            className="rounded-xl p-3 flex flex-col gap-2 border border-border"
            style={{ background: `${c.color}${c.alpha}` }}
          >
            <div className="flex items-center gap-1" style={{ color: c.color }}>
              {c.icon}
            </div>
            <p className="text-sm font-black tabular-nums leading-none" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[9px] font-semibold text-muted leading-none">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tren chart */}
      <div>
        <p className="text-[10px] font-semibold text-muted mb-2">Tren 6 Bulan</p>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={d.tren} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="mo" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone" dataKey="nw"
              stroke="#4F46E5" strokeWidth={2.5}
              fill="url(#nwGrad2)" dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#4F46E5' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
