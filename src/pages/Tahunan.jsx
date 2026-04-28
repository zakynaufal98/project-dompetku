import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS, CHART_COLORS } from '../lib/utils'
import { Empty, PanelHeader, DonutLegend } from '../components/UI'
import { CalendarDays, PieChart as PieChartIcon } from 'lucide-react'

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

  const txT  = txData.filter(t => t.date?.startsWith(year))
  const invT = invData.filter(t => t.date?.startsWith(year))
  
  // PERBAIKAN: Menghitung Pemasukan & Pengeluaran secara menyeluruh (Termasuk Investasi)
  const txIn   = txT.filter(t => t.type === 'in').reduce((s,t) => s + t.amount, 0)
  const txOut  = txT.filter(t => t.type === 'out').reduce((s,t) => s + t.amount, 0)
  
  const invBuy  = invT.filter(t => t.action === 'beli').reduce((s,t) => s + t.amount, 0)
  const invSell = invT.filter(t => t.action === 'jual').reduce((s,t) => s + t.amount, 0)

  // Total Pemasukan = Transaksi Masuk + Jual Investasi
  const totalIn  = txIn + invSell
  // Total Pengeluaran = Transaksi Keluar + Beli Investasi
  const totalOut = txOut + invBuy
  
  // Netto Investasi = Uang yang masih nyangkut di instrumen (Belum dijual)
  const invNet = invBuy - invSell

  // Saldo Tahunan = Total Uang Masuk - Total Uang Keluar
  const saldo = totalIn - totalOut

  // PERBAIKAN: Perhitungan per Bulan (Digabung dengan Investasi)
  const monthData = useMemo(() => MONTHS.map((name, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`
    
    const mTxIn   = txData.filter(t => t.type === 'in' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const mInvSell= invData.filter(t => t.action === 'jual' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const masuk   = mTxIn + mInvSell

    const mTxOut  = txData.filter(t => t.type === 'out' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const mInvBuy = invData.filter(t => t.action === 'beli' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const keluar  = mTxOut + mInvBuy

    return { name, masuk, keluar, net: masuk - keluar }
  }), [txData, invData, year])

  // Donut Chart Top Pengeluaran (Hanya dari Kategori Transaksi biasa, bukan investasi)
  const catOut = useMemo(() => {
    const m = {}
    txT.filter(t => t.type === 'out').forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount })
    return m
  }, [txT])
  
  const donutD = Object.entries(catOut).filter(([,v]) => v > 0).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i] }))
  
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Laporan Tahunan</h1>
          <p className="text-muted text-sm font-medium mt-1">Performa keuangan sepanjang tahun</p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-1.5 shadow-sm px-4">
          <CalendarDays size={16} className="text-income" />
          <select className="bg-transparent text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none ml-1 pr-2" value={year} onChange={e => setYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm col-span-2 md:col-span-1">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Netto {year}</p>
          <p className={`tabular-nums font-bold text-3xl tracking-tight ${saldo >= 0 ? 'text-text' : 'text-expense'}`}>{fmt(saldo)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Pemasukan</p>
          <p className="tabular-nums font-bold text-2xl text-income tracking-tight">{fmtShort(totalIn)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Pengeluaran</p>
          <p className="tabular-nums font-bold text-2xl text-gold tracking-tight">{fmtShort(totalOut)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Investasi</p>
          <p className="tabular-nums font-bold text-2xl text-invest tracking-tight">{fmtShort(Math.max(0, invNet))}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
        <PanelHeader title="Pemasukan vs Pengeluaran per Bulan" />
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthData} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis width={60} tickFormatter={fmtShort} tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgb(var(--color-bg) / 0.8)'}} />
              <Bar dataKey="masuk" name="Pemasukan" fill="#4F46E5" radius={[6,6,0,0]} maxBarSize={24} />
              <Bar dataKey="keluar" name="Pengeluaran" fill="#FF8A00" radius={[6,6,0,0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Top Pengeluaran" />
          <div className="flex-1 flex flex-col justify-center mt-4">
            {donutD.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutD} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                      {donutD.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6"><DonutLegend data={catOut} /></div>
              </>
            ) : <div className="h-full flex flex-col justify-center items-center opacity-50"><PieChartIcon size={48} className="text-muted2 mb-2"/><p className="text-sm font-medium">Belum ada data</p></div>}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 overflow-x-auto">
          <PanelHeader title="Rekapitulasi" />
          <table className="w-full text-sm mt-4 text-left">
            <thead>
              <tr className="border-b border-border text-muted2 text-xs uppercase tracking-wider">
                <th className="py-3 font-semibold">Bulan</th>
                <th className="py-3 font-semibold text-right">Masuk</th>
                <th className="py-3 font-semibold text-right">Keluar</th>
                <th className="py-3 font-semibold text-right">Netto</th>
              </tr>
            </thead>
            <tbody>
              {monthData.map(row => (
                <tr key={row.name} className="border-b border-border hover:bg-bg">
                  <td className="py-4 text-text-2 font-bold">{row.name}</td>
                  <td className="py-4 text-right text-income tabular-nums font-semibold">{fmtShort(row.masuk)}</td>
                  <td className="py-4 text-right text-gold tabular-nums font-semibold">{fmtShort(row.keluar)}</td>
                  <td className={`py-4 text-right tabular-nums font-bold ${row.net >= 0 ? 'text-text' : 'text-expense'}`}>{fmtShort(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}