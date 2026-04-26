import { useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS, CHART_COLORS } from '../lib/utils'
// PERBAIKAN: Tambahkan TxItem untuk pop-up
import { Empty, PanelHeader, ProgressBar, TxItem } from '../components/UI'
// PERBAIKAN: Tambahkan ikon X untuk tombol tutup
import { LineChart, BarChartHorizontal, PieChart as PieChartIcon, X } from 'lucide-react'

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
      <p className="text-[10px] text-indigo-500 font-medium mt-2 pt-2 border-t border-slate-100">
        Klik batang untuk lihat detail ✨
      </p>
    </div>
  )
}

export default function Grafik() {
  const { txData, invData, totals } = useData()
  const now = new Date()

  // STATE BARU UNTUK POP-UP DRILL-DOWN
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedLabel, setSelectedLabel] = useState('')

  const saldoLine = useMemo(() => {
    let cum = 0
    return [...txData].sort((a,b) => new Date(a.date) - new Date(b.date)).map(t => {
      cum += t.type === 'in' ? t.amount : -t.amount
      return { date: t.date?.slice(5), saldo: cum }
    })
  }, [txData])

  const catData = useMemo(() => {
    const m = {}
    txData.filter(t => t.type === 'out').forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount })
    return Object.entries(m).sort((a,b) => b[1] - a[1]).slice(0,8)
      .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0,13) + '…' : name, value }))
  }, [txData])

  const invLine = useMemo(() => Array.from({length: 6}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      name: MONTHS[d.getMonth()],
      Beli: invData.filter(t => t.action === 'beli' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0),
      Jual: invData.filter(t => t.action === 'jual' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0),
    }
  }), [invData, now])

  const ratioData = [
    { name: 'Pemasukan',   value: totals.totalIn,          fill: '#4F46E5' },
    { name: 'Pengeluaran', value: totals.totalOut,         fill: '#FF8A00' },
    { name: 'Investasi',   value: Math.max(0, totals.invNet), fill: '#10B981' },
  ].filter(d => d.value > 0)

  const heatmap = useMemo(() => {
    const byDate = {}; txData.filter(t => t.type === 'out').forEach(t => { if(t.date) byDate[t.date] = (byDate[t.date] || 0) + t.amount })
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); const start = new Date(end); start.setFullYear(start.getFullYear() - 1)
    const cells = []; const cur = new Date(start); cur.setDate(cur.getDate() - cur.getDay()); let col = 0; const maxVal = Math.max(...Object.values(byDate), 1)
    while(cur <= end) {
      const dow = cur.getDay(); if(dow === 0 && cells.length > 0) col++
      const ds = cur.toISOString().split('T')[0]; const v = byDate[ds] || 0
      cells.push({ col, row: dow, ds, v, alpha: v ? 0.2 + 0.8 * (v / maxVal) : 0.05 })
      cur.setDate(cur.getDate() + 1); if(dow === 6) col++
    }
    return cells
  }, [txData, now])

  const dailyExpense = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}-`;

    const data = [];
    let maxDay = { date: '', value: 0 };

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${prefix}${String(i).padStart(2, '0')}`;
      
      const outTx = txData.filter(t => t.type === 'out' && t.date === dateStr).reduce((s, t) => s + t.amount, 0);
      const outInv = invData.filter(t => t.action === 'beli' && t.date === dateStr).reduce((s, t) => s + t.amount, 0);
      const val = outTx + outInv;

      data.push({ 
        tanggal: String(i), 
        Pengeluaran: val,
        labelInfo: `${i} ${MONTHS[m]}`,
        fullDate: dateStr // Disimpan untuk filter Pop-up
      });

      if (val > maxDay.value) {
        maxDay = { date: `${i} ${MONTHS[m]}`, value: val };
      }
    }
    return { data, maxDay, currentMonthLabel: `${MONTHS[m]} ${y}` };
  }, [txData, invData, now])

  // DATA UNTUK POP-UP: Filter transaksi khusus di tanggal yang di-klik
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return [];
    const txs = txData.filter(t => t.type === 'out' && t.date === selectedDate);
    const invs = invData.filter(t => t.action === 'beli' && t.date === selectedDate).map(i => ({...i, type: 'out', cat: 'Investasi', isInv: true}));
    return [...txs, ...invs];
  }, [selectedDate, txData, invData])

  return(
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10 relative">
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Grafik & Analisis</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Visualisasi mendalam arus kasmu</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <PanelHeader title={`Pengeluaran Harian (${dailyExpense.currentMonthLabel})`} />
          {dailyExpense.maxDay.value > 0 && (
            <div className="text-right bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-0.5">Hari Terboros</span>
              <span className="text-sm font-black text-rose-600">{dailyExpense.maxDay.date} • {fmtShort(dailyExpense.maxDay.value)}</span>
            </div>
          )}
        </div>
        
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyExpense.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tanggal" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
              
              {/* PERBAIKAN: Menambahkan onClick pada Bar */}
              <Bar 
                dataKey="Pengeluaran" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={30}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(data) => {
                  if(data.Pengeluaran > 0) {
                    setSelectedDate(data.fullDate);
                    setSelectedLabel(data.labelInfo);
                  }
                }}
              >
                {dailyExpense.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.Pengeluaran === dailyExpense.maxDay.value && entry.Pengeluaran > 0 ? '#E11D48' : '#FF8A00'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
          <PanelHeader title="Perkembangan Saldo" />
          {saldoLine.length > 0 ? (
            <div className="mt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={saldoLine} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} minTickGap={30} />
                  <YAxis width={60} tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#4F46E5" strokeWidth={3} fill="url(#saldoGrad)" activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[250px] flex items-center justify-center opacity-50"><LineChart size={40} className="text-slate-300 mb-2" strokeWidth={1.5} /></div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
          <PanelHeader title="Top Kategori Pengeluaran" />
          {catData.length > 0 ? (
            <div className="mt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:11, fill:'#64748b', fontWeight: 600}} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" name="Pengeluaran" radius={[0,6,6,0]} maxBarSize={16}>
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[250px] flex items-center justify-center opacity-50"><BarChartHorizontal size={40} className="text-slate-300 mb-2" strokeWidth={1.5} /></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
          <PanelHeader title="Aktivitas Investasi (6 Bulan)" />
          <div className="mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invLine} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis width={60} tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="Beli" fill="#10B981" radius={[4,4,0,0]} maxBarSize={24} />
                <Bar dataKey="Jual" fill="#FF8A00" radius={[4,4,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
          <PanelHeader title="Rasio Keuangan" />
          {ratioData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8 mt-6">
              <div className="w-[160px] h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ratioData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                      {ratioData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-5 flex-1 w-full">
                {ratioData.map(d => {
                  const total = ratioData.reduce((s,r) => s + r.value, 0) || 1
                  return (
                    <div key={d.name}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600"><span className="w-3.5 h-3.5 rounded-full" style={{background: d.fill}} />{d.name}</span>
                        <span className="tabular-nums font-bold text-slate-800">{fmtShort(d.value)}</span>
                      </div>
                      <ProgressBar value={d.value} max={total} color={d.fill} />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : <div className="h-[200px] flex items-center justify-center opacity-50"><PieChartIcon size={40} className="text-slate-300 mb-2" strokeWidth={1.5} /></div>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
        <PanelHeader title="Intensitas Pengeluaran Harian (1 Tahun)" />
        <div className="overflow-x-auto pb-4 mt-6 custom-scrollbar">
          <svg width={Math.max(...heatmap.map(c=>c.col), 0) * 16 + 60} height={7 * 16 + 26} style={{ minWidth: '500px' }}>
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => ( i % 2 === 0 && <text key={d} x={0} y={i * 16 + 12} fontSize={11} fill="#94a3b8" fontWeight="600">{d}</text> ))}
            {heatmap.map((c, idx) => (
              <rect key={idx} x={c.col * 16 + 40} y={c.row * 16} width={13} height={13} rx={3} fill={c.v > 0 ? `rgba(255, 138, 0, ${c.alpha.toFixed(2)})` : '#f8fafc'} className="transition-opacity duration-200 hover:opacity-70 cursor-pointer">
                {c.v > 0 && <title>{c.ds} : {fmt(c.v)}</title>}
              </rect>
            ))}
          </svg>
        </div>
      </div>

      {/* --- MODAL POP-UP DETAIL TRANSAKSI --- */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-fade-up flex flex-col max-h-[80vh]">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Detail Pengeluaran</h3>
                <p className="text-slate-500 text-sm font-medium mt-0.5">{selectedLabel}</p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Isi Modal */}
            <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
              <div className="space-y-1.5">
                {selectedDayData.length > 0 ? (
                  selectedDayData.map(t => <TxItem key={t.id} t={t} isInv={t.isInv} />)
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-slate-500 font-medium">Data rincian tidak ditemukan.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}