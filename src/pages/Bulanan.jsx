import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS_FULL, CHART_COLORS, CAT_ICONS } from '../lib/utils'
import { TxItem, Empty, PanelHeader, DonutLegend, ProgressBar } from '../components/UI'
import { PieChart as PieChartIcon, ClipboardList, CalendarX, CalendarDays } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-lg">
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Bulanan() {
  const { txData, invData } = useData()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth()+1)
  const [year,  setYear]  = useState(now.getFullYear())

  const years = useMemo(()=>{
    const all=[...txData,...invData].map(t=>t.date?.split('-')[0]).filter(Boolean)
    const s=[...new Set(all)].sort().reverse()
    return s.length?s:[now.getFullYear().toString()]
  },[txData,invData])

  const ym = `${year}-${String(month).padStart(2,'0')}`
  
  // Data Bulan Ini
  const txBln  = txData.filter(t=>t.date?.startsWith(ym))
  const invBln = invData.filter(t=>t.date?.startsWith(ym))
  
  // PERBAIKAN LOGIKA: Hitung Pemasukan dan Pengeluaran Total
  const txIn   = txBln.filter(t=>t.type==='in').reduce((s,t)=>s+t.amount,0)
  const txOut  = txBln.filter(t=>t.type==='out').reduce((s,t)=>s+t.amount,0)
  
  const invBuy = invBln.filter(t=>t.action==='beli').reduce((s,t)=>s+t.amount,0)
  const invSell= invBln.filter(t=>t.action==='jual').reduce((s,t)=>s+t.amount,0)

  // Total Arus Kas
  const totalIn  = txIn + invSell
  const totalOut = txOut + invBuy
  
  // Netto Investasi
  const invNet = invBuy - invSell

  // Saldo
  const saldo = totalIn - totalOut

  // Data Distribusi Pengeluaran (Hanya dari Kategori Transaksi)
  const catOut = useMemo(()=>{
    const m={}
    txBln.filter(t=>t.type==='out').forEach(t=>{m[t.cat]=(m[t.cat]||0)+t.amount})
    return m
  },[txBln])

  const sorted  = Object.entries(catOut).sort((a,b)=>b[1]-a[1])
  const maxCat  = sorted[0]?.[1]||1
  const donutD  = sorted.filter(([,v])=>v>0).map(([name,value],i)=>({name,value,fill:CHART_COLORS[i]}))

  // Gabungkan semua riwayat transaksi & investasi bulan ini untuk ditampilkan di bawah
  const allHistory = useMemo(() => {
    const combined = [
      ...txBln,
      ...invBln.map(i => ({
        ...i,
        type: i.action === 'beli' ? 'out' : 'in',
        cat: 'Investasi'
      }))
    ];
    // Urutkan dari yang terbaru
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [txBln, invBln]);

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Ringkasan Bulanan</h1>
          <p className="text-muted text-sm font-medium mt-1">Analisis arus kas per bulan</p>
        </div>

        <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-1.5 shadow-sm px-4">
          <CalendarDays size={16} className="text-income" />
          <select className="bg-transparent text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none ml-1" value={month} onChange={e=>setMonth(+e.target.value)}>
            {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <span className="text-muted2">/</span>
          <select className="bg-transparent text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none" value={year} onChange={e=>setYear(+e.target.value)}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm col-span-2 md:col-span-1">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Netto Bulan Ini</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Distribusi Pengeluaran" />
          <div className="flex-1 flex flex-col justify-center mt-4">
            {donutD.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutD} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                      {donutD.map((_,i)=><Cell key={i} fill={CHART_COLORS[i]}/>)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6"><DonutLegend data={catOut} /></div>
              </>
            ) : <div className="h-full flex flex-col justify-center items-center opacity-50"><PieChartIcon size={48} className="text-muted2 mb-2"/><p className="text-sm font-medium">Data kosong</p></div>}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm lg:col-span-3">
          <PanelHeader title="Rincian Pengeluaran" />
          {sorted.length > 0 ? (
            <div className="space-y-5 mt-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {sorted.map(([cat,val],i)=>(
                <div key={cat} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-semibold text-text-2 flex items-center gap-2"><span className="opacity-70 scale-90">{CAT_ICONS[cat]}</span> {cat}</span>
                    <span className="text-text tabular-nums font-bold">{fmtShort(val)}</span>
                  </div>
                  <ProgressBar value={val} max={maxCat} color={CHART_COLORS[i % CHART_COLORS.length]} />
                </div>
              ))}
            </div>
          ) : <div className="py-8"><Empty icon={<ClipboardList size={40} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Belum ada data" /></div>}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
        <PanelHeader title="Transaksi Bulan Ini" badge={`${allHistory.length} transaksi`}/>
        <div className="space-y-1.5 mt-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {allHistory.length > 0 ? allHistory.map(t => <TxItem key={t.id} t={t} isInv={t.action !== undefined} />) : <div className="py-8"><Empty icon={<CalendarX size={40} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Tidak ada transaksi bulan ini" /></div>}
        </div>
      </div>
    </div>
  )
}