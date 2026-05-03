import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, fmtChartAxis, MONTHS, MONTHS_FULL, CHART_COLORS, CAT_ICONS } from '../lib/utils'
import { Empty, PanelHeader, InteractiveDonut, ProgressBar } from '../components/UI'
import { CalendarDays, ClipboardList, TrendingUp, TrendingDown, Crown, AlertTriangle, Zap, Award } from 'lucide-react'

// Tooltip khusus untuk BarChart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-lg">
      <p className="text-muted font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Tahunan() {
  const { txData, invData } = useData()
  const now = new Date()
  
  const years = useMemo(() => {
    const all = [...txData, ...invData].map(t => t.date?.split('-')[0]).filter(Boolean)
    const s = [...new Set(all)].sort().reverse()
    return s.length ? s : [now.getFullYear().toString()]
  }, [txData, invData])
  
  const [year, setYear] = useState(years[0] || now.getFullYear().toString())
  
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('updateExportDate', { detail: year }))
  }, [year])

  const txT  = txData.filter(t => t.date?.startsWith(year))
  const invT = invData.filter(t => t.date?.startsWith(year))
  
  const txIn   = txT.filter(t => t.type === 'in' && t.cat !== 'Transfer').reduce((s,t) => s + t.amount, 0)
  const txOut  = txT.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman')).reduce((s,t) => s + t.amount, 0)
  
  const invBuy  = invT.filter(t => t.action === 'beli').reduce((s,t) => s + t.amount, 0)
  const invSell = invT.filter(t => t.action === 'jual').reduce((s,t) => s + t.amount, 0)
  const invNet = invBuy - invSell
  const nettoTahunan = txIn - txOut

  // Data per bulan
  const monthData = useMemo(() => MONTHS.map((name, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`
    const masuk  = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const keluar = txData.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman') && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    return { name, fullName: MONTHS_FULL[i], masuk, keluar, net: masuk - keluar, index: i }
  }), [txData, year])

  // YoY Comparison
  const lastYear = String(Number(year) - 1)
  const lastTxIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(lastYear)).reduce((s,t) => s + t.amount, 0)
  const lastTxOut = txData.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman') && t.date?.startsWith(lastYear)).reduce((s,t) => s + t.amount, 0)
  const yoyInChange = lastTxIn > 0 ? ((txIn - lastTxIn) / lastTxIn * 100).toFixed(1) : null
  const yoyOutChange = lastTxOut > 0 ? ((txOut - lastTxOut) / lastTxOut * 100).toFixed(1) : null

  // Highlights
  const highlights = useMemo(() => {
    const withData = monthData.filter(m => m.masuk > 0 || m.keluar > 0)
    if (withData.length === 0) return null

    const bestMonth = [...withData].sort((a, b) => b.net - a.net)[0]
    const worstMonth = [...withData].sort((a, b) => a.net - b.net)[0]
    const avgOut = withData.length > 0 ? withData.reduce((s, m) => s + m.keluar, 0) / withData.length : 0
    const avgIn = withData.length > 0 ? withData.reduce((s, m) => s + m.masuk, 0) / withData.length : 0
    const biggestExpenseMonth = [...withData].sort((a, b) => b.keluar - a.keluar)[0]
    
    return { bestMonth, worstMonth, avgOut, avgIn, biggestExpenseMonth }
  }, [monthData])

  // Top 10 transaksi terbesar
  const topTransactions = useMemo(() => {
    return txT
      .filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman'))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [txT])

  // Savings rate
  const savingsRate = txIn > 0 ? (((nettoTahunan > 0 ? nettoTahunan : 0) + invBuy) / txIn * 100).toFixed(1) : 0

  // Donut data
  const txYearOut = useMemo(() => {
    return txT.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman'));
  }, [txT]);

  // Category breakdown with progress
  const catBreakdown = useMemo(() => {
    const m = {}
    txYearOut.forEach(t => { m[t.cat || 'Lainnya'] = (m[t.cat || 'Lainnya'] || 0) + t.amount })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [txYearOut])
  
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-bold text-xl text-text tracking-tight">Laporan Tahunan</h1>
          <p className="text-muted text-sm font-medium mt-0.5">Performa keuangan sepanjang tahun</p>
        </div>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-1.5 shadow-sm px-4 self-start">
          <CalendarDays size={16} className="text-income" />
          <select className="bg-surface text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none ml-1 pr-2" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
      </div>

      {/* Metric Cards: 2-col mobile, 5-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Netto {year}</p>
          <p className={`tabular-nums font-bold text-lg sm:text-xl tracking-tight truncate ${nettoTahunan >= 0 ? 'text-text' : 'text-expense'}`}>{fmt(nettoTahunan)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Pemasukan</p>
          <p className="tabular-nums font-bold text-base sm:text-lg text-income tracking-tight truncate">{fmtShort(txIn)}</p>
          {yoyInChange !== null && (
            <div className="flex items-center gap-1 mt-1">
              {Number(yoyInChange) >= 0 ? <TrendingUp size={10} className="text-income" /> : <TrendingDown size={10} className="text-expense" />}
              <span className={`text-[9px] font-bold ${Number(yoyInChange) >= 0 ? 'text-income' : 'text-expense'}`}>{Number(yoyInChange) >= 0 ? '+' : ''}{yoyInChange}%</span>
            </div>
          )}
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Pengeluaran</p>
          <p className="tabular-nums font-bold text-base sm:text-lg text-gold tracking-tight truncate">{fmtShort(txOut)}</p>
          {yoyOutChange !== null && (
            <div className="flex items-center gap-1 mt-1">
              {Number(yoyOutChange) <= 0 ? <TrendingDown size={10} className="text-income" /> : <TrendingUp size={10} className="text-expense" />}
              <span className={`text-[9px] font-bold ${Number(yoyOutChange) <= 0 ? 'text-income' : 'text-expense'}`}>{Number(yoyOutChange) >= 0 ? '+' : ''}{yoyOutChange}%</span>
            </div>
          )}
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Investasi</p>
          <p className="tabular-nums font-bold text-base sm:text-lg text-invest tracking-tight truncate">{fmtShort(Math.max(0, invNet))}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-sm text-white">
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Savings Rate</p>
          <p className="tabular-nums font-black text-2xl tracking-tight">{savingsRate}%</p>
          <p className="text-[9px] text-white/50 font-medium mt-1">diamankan</p>
        </div>
      </div>

      {/* HIGHLIGHTS */}
      {highlights && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-income-light text-income flex items-center justify-center flex-shrink-0"><Crown size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Bulan Terbaik</p>
              <p className="font-black text-text text-sm truncate">{highlights.bestMonth.fullName}</p>
              <p className="text-income text-xs font-bold tabular-nums truncate">+{fmtShort(highlights.bestMonth.net)}</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-expense-light text-expense flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Bulan Terburuk</p>
              <p className="font-black text-text text-sm truncate">{highlights.worstMonth.fullName}</p>
              <p className={`text-xs font-bold tabular-nums truncate ${highlights.worstMonth.net >= 0 ? 'text-income' : 'text-expense'}`}>{fmtShort(highlights.worstMonth.net)}</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-light text-gold flex items-center justify-center flex-shrink-0"><Zap size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Rata-rata Keluar</p>
              <p className="font-black text-gold text-base tabular-nums truncate">{fmtShort(highlights.avgOut)}</p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-invest-light text-invest flex items-center justify-center flex-shrink-0"><Award size={18} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Rata-rata Masuk</p>
              <p className="font-black text-income text-base tabular-nums truncate">{fmtShort(highlights.avgIn)}</p>
            </div>
          </div>
        </div>
      )}

      {/* GRAFIK BAR */}
      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
        <PanelHeader title="Pemasukan vs Pengeluaran per Bulan" />
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis width={45} tickFormatter={fmtChartAxis} tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgb(var(--color-bg) / 0.8)'}} />
              <Bar dataKey="masuk" name="Pemasukan Murni" fill="#4F46E5" radius={[6,6,0,0]} maxBarSize={24} />
              <Bar dataKey="keluar" name="Pengeluaran Murni" fill="#FF8A00" radius={[6,6,0,0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut + Tabel – stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Distribusi Pengeluaran" />
          <InteractiveDonut data={txYearOut} />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-3 overflow-x-auto">
          <PanelHeader title="Rekapitulasi Arus Kas" />
          {monthData.some(m => m.masuk > 0 || m.keluar > 0) ? (
            <table className="w-full text-sm mt-4 text-left min-w-[280px]">
              <thead>
                <tr className="border-b border-border text-muted2 text-xs uppercase tracking-wider">
                  <th className="py-2 font-semibold">Bulan</th>
                  <th className="py-2 font-semibold text-right">Masuk</th>
                  <th className="py-2 font-semibold text-right">Keluar</th>
                  <th className="py-2 font-semibold text-right">Netto</th>
                </tr>
              </thead>
              <tbody>
                {monthData.map(row => (
                  <tr key={row.name} className="border-b border-border hover:bg-bg transition-colors">
                    <td className="py-3 text-text-2 font-bold text-xs">{row.name}</td>
                    <td className="py-3 text-right text-income tabular-nums font-semibold text-xs">{fmtShort(row.masuk)}</td>
                    <td className="py-3 text-right text-gold tabular-nums font-semibold text-xs">{fmtShort(row.keluar)}</td>
                    <td className={`py-3 text-right tabular-nums font-bold text-xs ${row.net >= 0 ? 'text-text' : 'text-expense'}`}>{fmtShort(row.net)}</td>
                  </tr>
                ))}
                <tr className="bg-bg font-black">
                  <td className="py-3 text-text text-xs">TOTAL</td>
                  <td className="py-3 text-right text-income tabular-nums text-xs">{fmtShort(txIn)}</td>
                  <td className="py-3 text-right text-gold tabular-nums text-xs">{fmtShort(txOut)}</td>
                  <td className={`py-3 text-right tabular-nums text-xs ${nettoTahunan >= 0 ? 'text-text' : 'text-expense'}`}>{fmtShort(nettoTahunan)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-12"><Empty icon={<ClipboardList size={36} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Belum ada data di tahun ini" /></div>
          )}
        </div>
      </div>

      {/* TOP 10 PENGELUARAN TERBESAR */}
      {topTransactions.length > 0 && (
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
          <PanelHeader title="Top 10 Pengeluaran Terbesar" badge={`Tahun ${year}`} />
          <div className="space-y-2 mt-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {topTransactions.map((t, i) => (
              <div key={t.id} className="flex items-center gap-4 p-3.5 bg-bg border border-border rounded-2xl hover:border-border2 transition-colors">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  i < 3 ? 'bg-expense-light text-expense' : 'bg-border text-muted'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text break-words">{t.desc}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[9px] font-bold text-muted bg-border px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[11px] font-semibold text-muted2">{t.cat}{t.sub_cat ? ` ▶ ${t.sub_cat}` : ''}</span>
                  </div>
                </div>
                <span className="font-black text-sm tabular-nums text-expense flex-shrink-0">-{fmtShort(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BREAKDOWN KATEGORI DENGAN PROGRESS */}
      {catBreakdown.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <PanelHeader title="Breakdown Pengeluaran per Kategori" />
          <div className="space-y-4 mt-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {catBreakdown.map(([cat, val], i) => {
              const pct = txOut > 0 ? (val / txOut * 100).toFixed(1) : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    <span className="text-xs font-semibold text-text-2 flex items-center gap-1.5 min-w-0 truncate">
                      <span className="opacity-70 flex-shrink-0">{CAT_ICONS[cat]}</span>
                      <span className="truncate">{cat}</span>
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-muted tabular-nums">{pct}%</span>
                      <span className="text-text tabular-nums font-bold text-xs">{fmtShort(val)}</span>
                    </div>
                  </div>
                  <ProgressBar value={val} max={catBreakdown[0]?.[1] || 1} color={CHART_COLORS[i % CHART_COLORS.length]} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}