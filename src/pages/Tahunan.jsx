import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS } from '../lib/utils'
import { Empty, PanelHeader, InteractiveDonut } from '../components/UI'
import { CalendarDays, ClipboardList } from 'lucide-react'

// Tooltip khusus untuk BarChart (InteractiveDonut sudah punya tooltip sendiri)
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

  // Filter transaksi berdasarkan tahun yang dipilih
  const txT  = txData.filter(t => t.date?.startsWith(year))
  const invT = invData.filter(t => t.date?.startsWith(year))
  
  // 👇 PERBAIKAN 1: LOGIKA MURNI SEPENUHNYA 👇
  // Menghitung murni gaya hidup, mengabaikan mutasi 'Transfer' (baik investasi maupun hutang)
  const txIn   = txT.filter(t => t.type === 'in' && t.cat !== 'Transfer').reduce((s,t) => s + t.amount, 0)
  const txOut  = txT.filter(t => t.type === 'out' && t.cat !== 'Transfer').reduce((s,t) => s + t.amount, 0)
  
  const invBuy  = invT.filter(t => t.action === 'beli').reduce((s,t) => s + t.amount, 0)
  const invSell = invT.filter(t => t.action === 'jual').reduce((s,t) => s + t.amount, 0)

  // Netto Investasi (Hanya untuk ditampilkan di kartu metrik Investasi)
  const invNet = invBuy - invSell

  // Netto Murni Tahunan (Seberapa banyak uang yang berhasil Anda "selamatkan" dari penghasilan murni)
  const nettoTahunan = txIn - txOut

  // 👇 PERBAIKAN 2: Grafik & Tabel Murni (Tidak ada lagi pencampuran dengan invBuy/invSell) 👇
  const monthData = useMemo(() => MONTHS.map((name, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, '0')}`
    
    // Hanya jumlahkan transaksi yang BUKAN Transfer
    const masuk  = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)
    const keluar = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0)

    return { name, masuk, keluar, net: masuk - keluar }
  }), [txData, year])

  // Data khusus untuk dilempar ke komponen Interactive Donut (Pengeluaran Murni)
  const txYearOut = useMemo(() => {
    return txT.filter(t => t.type === 'out' && t.cat !== 'Transfer');
  }, [txT]);
  
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Laporan Tahunan</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted text-sm font-medium">Performa keuangan sepanjang tahun</p>
            <span className="bg-surface border border-border px-2 py-0.5 rounded text-[10px] text-muted2 font-bold uppercase tracking-wider">
              Murni (Tanpa Transfer)
            </span>
          </div>
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
          <p className={`tabular-nums font-bold text-3xl tracking-tight ${nettoTahunan >= 0 ? 'text-text' : 'text-expense'}`}>{fmt(nettoTahunan)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Pemasukan</p>
          <p className="tabular-nums font-bold text-2xl text-income tracking-tight">{fmtShort(txIn)}</p>
        </div>
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Pengeluaran</p>
          <p className="tabular-nums font-bold text-2xl text-gold tracking-tight">{fmtShort(txOut)}</p>
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
              <Bar dataKey="masuk" name="Pemasukan Murni" fill="#4F46E5" radius={[6,6,0,0]} maxBarSize={24} />
              <Bar dataKey="keluar" name="Pengeluaran Murni" fill="#FF8A00" radius={[6,6,0,0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* KARTU DISTRIBUSI PENGELUARAN (Menggunakan Interactive Donut) */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Distribusi Pengeluaran" />
          <InteractiveDonut data={txYearOut} />
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 overflow-x-auto">
          <PanelHeader title="Rekapitulasi Arus Kas" />
          {monthData.some(m => m.masuk > 0 || m.keluar > 0) ? (
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
                  <tr key={row.name} className="border-b border-border hover:bg-bg transition-colors">
                    <td className="py-4 text-text-2 font-bold">{row.name}</td>
                    <td className="py-4 text-right text-income tabular-nums font-semibold">{fmtShort(row.masuk)}</td>
                    <td className="py-4 text-right text-gold tabular-nums font-semibold">{fmtShort(row.keluar)}</td>
                    <td className={`py-4 text-right tabular-nums font-bold ${row.net >= 0 ? 'text-text' : 'text-expense'}`}>{fmtShort(row.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12"><Empty icon={<ClipboardList size={40} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Belum ada data di tahun ini" /></div>
          )}
        </div>
      </div>
    </div>
  )
}