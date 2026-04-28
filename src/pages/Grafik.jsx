import { useMemo, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS, CHART_COLORS } from '../lib/utils'
import { Empty, PanelHeader, ProgressBar, TxItem } from '../components/UI'
import { LineChart, BarChartHorizontal, PieChart as PieChartIcon, X } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  
  // Gunakan optional chaining (?.) untuk memastikan label tidak undefined
  const hasLabel = typeof label === 'string';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-lg">
      {hasLabel && <p className="text-slate-500 font-semibold mb-1">{label}</p>}
      
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-slate-800">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
      
      {/* Pengecekan label.includes sekarang aman */}
      {payload.length === 1 && payload[0].name === 'Pengeluaran' && hasLabel && label.includes(' ') && (
        <p className="text-[10px] text-indigo-500 font-medium mt-2 pt-2 border-t border-slate-100">
          Klik batang untuk lihat detail ✨
        </p>
      )}
    </div>
  )
}

export default function Grafik() {
  const { txData, invData, totals, walletData } = useData()
  const now = new Date()
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

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
    txData
      .filter(t => t.type === 'out' && t.date?.startsWith(currentMonthPrefix))
      .forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount })
      
    return Object.entries(m).sort((a,b) => b[1] - a[1]).slice(0,8)
      .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0,13) + '…' : name, value }))
  }, [txData, currentMonthPrefix])

  const invLine = useMemo(() => Array.from({length: 6}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      name: MONTHS[d.getMonth()],
      Beli: invData.filter(t => t.action === 'beli' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0),
      Jual: invData.filter(t => t.action === 'jual' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0),
    }
  }), [invData, now])

  const ratioData = useMemo(() => {
    let inM = 0, outM = 0, invM = 0;
    
    txData.forEach(t => {
      if (t.date?.startsWith(currentMonthPrefix)) {
        if (t.type === 'in') inM += t.amount;
        if (t.type === 'out') outM += t.amount;
      }
    });
    
    invData.forEach(t => {
      if (t.date?.startsWith(currentMonthPrefix) && t.action === 'beli') invM += t.amount;
    });

    return [
      { name: 'Pemasukan',   value: inM,  fill: '#4F46E5' },
      { name: 'Pengeluaran', value: outM, fill: '#FF8A00' },
      { name: 'Investasi',   value: invM, fill: '#10B981' },
    ].filter(d => d.value > 0);
  }, [txData, invData, currentMonthPrefix]);

  const cashflowData = useMemo(() => {
    return Array.from({length: 6}, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      
      const pemasukan = txData.filter(t => t.type === 'in' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0);
      const pengeluaran = txData.filter(t => t.type === 'out' && t.date?.startsWith(ym)).reduce((s,t) => s + t.amount, 0);
      
      return {
        name: MONTHS[d.getMonth()],
        Pemasukan: pemasukan,
        Pengeluaran: pengeluaran
      }
    })
  }, [txData, now]);

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
        fullDate: dateStr
      });

      if (val > maxDay.value) {
        maxDay = { date: `${i} ${MONTHS[m]}`, value: val };
      }
    }
    return { data, maxDay, currentMonthLabel: `${MONTHS[m]} ${y}` };
  }, [txData, invData, now])

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return [];
    const txs = txData.filter(t => t.type === 'out' && t.date === selectedDate);
    const invs = invData.filter(t => t.action === 'beli' && t.date === selectedDate).map(i => ({...i, type: 'out', cat: 'Investasi', isInv: true}));
    return [...txs, ...invs];
  }, [selectedDate, txData, invData])

  return(
    <>
      <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10 relative">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Grafik & Analisis</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Visualisasi mendalam arus kasmu</p>
        </div>

        {/* 1. GRAFIK PENGELUARAN HARIAN */}
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

        {/* 2. SALDO & TOP KATEGORI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
            <PanelHeader title="Perkembangan Saldo (Semua Waktu)" />
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
            <PanelHeader title={`Top Kategori (${MONTHS[now.getMonth()]})`} />
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

        {/* 3. ARUS KAS & RASIO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm order-2 lg:order-1">
            <PanelHeader title="Arus Kas (6 Bulan Terakhir)" />
            <div className="mt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} barGap={4} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis width={60} tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="Pemasukan" fill="#4F46E5" radius={[4,4,0,0]} maxBarSize={24} />
                  <Bar dataKey="Pengeluaran" fill="#FF8A00" radius={[4,4,0,0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm order-1 lg:order-2">
            <PanelHeader title={`Rasio Keuangan (${MONTHS[now.getMonth()]})`} />
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

        {/* 4. INVESTASI LINE */}
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

      </div> 

      {/* --- BOTTOM SHEET / SIDE DRAWER RESPONSIVE --- */}
      {selectedDate && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={() => setSelectedDate(null)} 
        >
          <div 
            className="fixed z-[101] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out 
                       animate-fade-up md:animate-none
                       bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[32px]
                       md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-[400px] md:h-full md:rounded-none md:border-l md:border-slate-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2 md:hidden flex-shrink-0" />

            <div className="flex items-center justify-between px-6 pt-2 pb-5 md:pt-8 md:pb-6 border-b border-slate-100 bg-white z-10 shrink-0">
              <div>
                <h3 className="font-bold text-xl text-slate-800">Detail Pengeluaran</h3>
                <p className="text-indigo-600 text-sm font-bold mt-1 bg-indigo-50 inline-block px-2.5 py-0.5 rounded-md">
                  {selectedLabel}
                </p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all cursor-pointer bg-slate-50"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
              <div className="space-y-2">
                {selectedDayData.length > 0 ? (
                  selectedDayData.map(t => (
                    <TxItem 
                      key={t.id} 
                      t={t} 
                      isInv={t.isInv} 
                      walletName={walletData?.find(w => w.id === t.wallet_id)?.name} 
                    />
                  ))
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center opacity-60">
                    <p className="text-slate-500 font-medium">Data rincian tidak ditemukan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}