import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS, CHART_COLORS } from '../lib/utils'
import { Empty, Spinner, DonutLegend } from '../components/UI'
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react'
import BillTracker from '../components/BillTracker'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-lg">
      <p className="text-slate-500 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-slate-800">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { txData, invData, loading, totals } = useData() 
  const now = new Date()
  
  // 1. HITUNGAN SPESIFIK BULAN INI & BULAN LALU
  const { currIn, currOut, trends } = useMemo(() => {
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYM = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

    const cInTx = txData.filter(t => t.type === 'in' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cInInv = invData.filter(t => t.action === 'jual' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cIn = cInTx + cInInv
    
    const cOutTx = txData.filter(t => t.type === 'out' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOutInv = invData.filter(t => t.action === 'beli' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOut = cOutTx + cOutInv

    const lInTx = txData.filter(t => t.type === 'in' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lInInv = invData.filter(t => t.action === 'jual' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lIn = lInTx + lInInv

    const lOutTx = txData.filter(t => t.type === 'out' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lOutInv = invData.filter(t => t.action === 'beli' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lOut = lOutTx + lOutInv

    const currSaldo = totals.saldo
    const lastSaldo = currSaldo - cIn + cOut

    const calcPct = (curr, last) => {
      if (last === 0) return curr > 0 ? 100 : 0
      return ((curr - last) / last) * 100
    }

    return {
      currIn: cIn,
      currOut: cOut,
      trends: {
        saldo: calcPct(currSaldo, lastSaldo),
        masuk: calcPct(cIn, lIn),
        keluar: calcPct(cOut, lOut)
      }
    }
  }, [txData, invData, totals.saldo, now])

  // 2. HITUNGAN SPESIFIK HARI INI
  const todayOut = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tOutTx = txData.filter(t => t.type === 'out' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    const tOutInv = invData.filter(t => t.action === 'beli' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    return tOutTx + tOutInv;
  }, [txData, invData, now]);

  // 3. DATA GRAFIK 6 BULAN
  const tren6 = useMemo(() => Array.from({length: 6}, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      name:   MONTHS[d.getMonth()],
      Pemasukan:  txData.filter(t => t.type === 'in' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0),
      Pengeluaran: txData.filter(t => t.type === 'out' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0),
    }
  }), [txData, now])

  // 4. DATA DONUT CHART KATEGORI
  const currYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const catOut = useMemo(() => {
    const m = {}
    txData.filter(t => t.type === 'out' && t.date?.startsWith(currYM))
      .forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount })
    return m
  }, [txData, currYM])

  const donutData = Object.entries(catOut).filter(([,v]) => v > 0)
    .sort((a,b) => b[1] - a[1])
    .map(([name, value], i) => ({name, value, fill: CHART_COLORS[i]}))

  const renderTrendBadge = (pct, isExpense = false) => {
    if (pct === 0) return <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-md font-bold text-[11px] tracking-wide">0%</span>
    const isPositive = pct > 0
    const isGood = isExpense ? !isPositive : isPositive 
    const colorClass = isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`${colorClass} flex items-center font-bold px-2 py-1 rounded-md text-[11px] tracking-wide`}>
        <Icon size={14} className="mr-1 stroke-[3px]" />
        {isPositive ? '+' : ''}{pct.toFixed(1)}%
      </span>
    )
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Overview</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Selamat datang kembali, mari pantau keuanganmu.</p>
        </div>
      </div>

      {/* PERUBAHAN: Grid menjadi 4 kolom untuk menampung widget Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD SALDO TOTAL */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Saldo Saat Ini</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Total</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#2F3241] tracking-tight truncate">{fmt(totals.saldo)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.saldo, false)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* CARD BARU: PENGELUARAN HARI INI (Desain Khusus) */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-600 rounded-[24px] p-6 shadow-sm flex flex-col justify-between text-white transform transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <span className="font-semibold text-base text-indigo-50">Keluar Hari Ini</span>
            <span className="text-[11px] font-bold bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider text-white">HARI INI</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl tracking-tight truncate">
              {todayOut > 0 ? `-${fmt(todayOut)}` : 'Rp 0'}
            </p>
            <div className="mt-3 text-[13px] font-medium text-indigo-100 flex items-center gap-1.5">
              {todayOut === 0 ? '✨ Hebat! Belum jajan hari ini' : '👀 Tetap pantau dompetmu!'}
            </div>
          </div>
        </div>

        {/* CARD PENGELUARAN BULAN INI */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Pengeluaran</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#FF8A00] tracking-tight truncate">{currOut > 0 ? `-${fmt(currOut)}` : fmt(currOut)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.keluar, true)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* CARD PEMASUKAN BULAN INI */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Pemasukan</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#10B981] tracking-tight truncate">{currIn > 0 ? `+${fmt(currIn)}` : fmt(currIn)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.masuk, false)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRID UTAMA BAWAH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KIRI: CHART KEUANGAN */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Total Keuangan (6 Bulan)</h3>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren6} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF8A00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                <YAxis width={85} tickFormatter={fmtShort} tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#FF8A00" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3.5 h-3.5 rounded-full bg-[#4F46E5]" />Pemasukan
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF8A00]" />Pengeluaran
            </div>
          </div>
        </div>

        {/* KANAN: STACK TAGIHAN & DONUT CHART */}
        <div className="flex flex-col gap-6">
          <BillTracker />
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Total Pengeluaran</h3>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {donutData.length > 0 ? (
                <>
                  <div className="relative h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                          {donutData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip formatter={v => fmtShort(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total</span>
                      <span className="tabular-nums font-bold text-2xl text-[#FF8A00] tracking-tight">{fmtShort(currOut)}</span>
                    </div>
                  </div>
                  <div className="mt-4"><DonutLegend data={catOut} /></div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <PieChartIcon size={48} className="text-slate-300 mb-3" strokeWidth={1} />
                  <p className="text-sm text-slate-400 font-medium">Belum ada pengeluaran</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}