import { useMemo, useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS_FULL, CHART_COLORS, CAT_ICONS } from '../lib/utils'
import { TxItem, Empty, PanelHeader, ProgressBar, InteractiveDonut } from '../components/UI'
import { ClipboardList, CalendarX, CalendarDays } from 'lucide-react'

export default function Bulanan() {
  // 👇 PERBAIKAN 1: Tambahkan walletData untuk menampilkan badge dompet di riwayat
  const { txData, invData, walletData } = useData()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth()+1)
  const [year,  setYear]  = useState(now.getFullYear())

  const years = useMemo(()=>{
    const all=[...txData,...invData].map(t=>t.date?.split('-')[0]).filter(Boolean)
    const s=[...new Set(all)].sort().reverse()
    return s.length?s:[now.getFullYear().toString()]
  },[txData,invData])

  const ym = `${year}-${String(month).padStart(2,'0')}`
  
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('updateExportDate', { detail: ym }))
  }, [ym])
  
  // Ambil semua arus kas bulan ini
  const txBln = txData.filter(t=>t.date?.startsWith(ym));
  
  // 👇 PERBAIKAN 2: Hitung Pemasukan & Pengeluaran Murni (Abaikan Transfer)
  const txIn  = txBln.filter(t=>t.type==='in' && t.cat !== 'Transfer').reduce((s,t)=>s+t.amount,0)
  const txOut = txBln.filter(t=>t.type==='out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman')).reduce((s,t)=>s+t.amount,0)
  
  // Netto (Uang yang berhasil disisihkan bulan ini, investasi tidak dihitung sebagai pengeluaran)
  const nettoBulanIni = txIn - txOut;

  // Tetap ambil data invData hanya untuk menampilkan metrik volume investasi bulan ini (bukan untuk cashflow)
  const invBln = invData.filter(t=>t.date?.startsWith(ym))
  const invBuy = invBln.filter(t=>t.action==='beli').reduce((s,t)=>s+t.amount,0)
  const invSell= invBln.filter(t=>t.action==='jual').reduce((s,t)=>s+t.amount,0)
  const invNet = invBuy - invSell

  // Filter khusus untuk Interactive Donut & Progress Bar (Hanya Pengeluaran Murni)
  const txBlnOut = useMemo(() => txBln.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman')), [txBln]);

  // Data Murni untuk PROGRESS BAR KANAN
  const catOut = useMemo(()=>{
    const m={}
    txBlnOut.forEach(t=>{
      const mainCat = t.cat || 'Lainnya'
      m[mainCat]=(m[mainCat]||0)+t.amount
    })
    return m
  },[txBlnOut])

  const sorted  = Object.entries(catOut).sort((a,b)=>b[1]-a[1])
  const maxCat  = sorted[0]?.[1]||1

  // 👇 PERBAIKAN 3: Riwayat hanya menggunakan txData agar tidak ada duplikasi
  const allHistory = useMemo(() => {
    return txBln.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA; 
      return (b.ts || 0) - (a.ts || 0); 
    });
  }, [txBln]);

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header + Date Picker */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="font-bold text-xl text-text tracking-tight">Ringkasan Bulanan</h1>
          <p className="text-muted text-sm font-medium mt-0.5">Analisis arus kas per bulan</p>
        </div>
        {/* Date Picker — full width on mobile */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full p-1.5 shadow-sm px-4 w-full sm:w-auto self-start">
          <CalendarDays size={16} className="text-income flex-shrink-0" />
          <select className="bg-surface text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none ml-1 flex-1 min-w-0" value={month} onChange={e=>setMonth(+e.target.value)}>
            {MONTHS_FULL.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <span className="text-muted2 flex-shrink-0">/</span>
          <select className="bg-surface text-sm font-bold text-text-2 outline-none cursor-pointer appearance-none flex-shrink-0" value={year} onChange={e=>setYear(+e.target.value)}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Metric Cards — 2-col on mobile, 4-col on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm col-span-2">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Netto Bulan Ini</p>
          <p className={`tabular-nums font-bold text-xl sm:text-2xl tracking-tight truncate ${nettoBulanIni >= 0 ? 'text-text' : 'text-expense'}`}>{fmt(nettoBulanIni)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Pemasukan</p>
          <p className="tabular-nums font-bold text-base sm:text-xl text-income tracking-tight truncate">{fmtShort(txIn)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Pengeluaran</p>
          <p className="tabular-nums font-bold text-base sm:text-xl text-gold tracking-tight truncate">{fmtShort(txOut)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm col-span-1">
          <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Investasi</p>
          <p className="tabular-nums font-bold text-base sm:text-xl text-invest tracking-tight truncate">{fmtShort(Math.max(0, invNet))}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-sm text-white col-span-1">
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Savings Rate</p>
          <p className="tabular-nums font-black text-xl tracking-tight">{txIn > 0 ? (((nettoBulanIni > 0 ? nettoBulanIni : 0)) / txIn * 100).toFixed(1) : 0}%</p>
        </div>
      </div>

      {/* Donut + Progress — stacked on mobile, side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Distribusi Pengeluaran" />
          <InteractiveDonut data={txBlnOut} />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-3">
          <PanelHeader title="Progress Pengeluaran" />
          {sorted.length > 0 ? (
            <div className="space-y-4 mt-4 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
              {sorted.map(([cat,val],i)=>(
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    <span className="text-xs font-semibold text-text-2 flex items-center gap-1.5 min-w-0 truncate">
                      <span className="opacity-70 flex-shrink-0">{CAT_ICONS[cat]}</span>
                      <span className="truncate">{cat}</span>
                    </span>
                    <span className="text-text tabular-nums font-bold text-xs flex-shrink-0">{fmtShort(val)}</span>
                  </div>
                  <ProgressBar value={val} max={maxCat} color={CHART_COLORS[i % CHART_COLORS.length]} />
                </div>
              ))}
            </div>
          ) : <div className="py-8"><Empty icon={<ClipboardList size={36} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Belum ada data" /></div>}
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <PanelHeader title="Transaksi Bulan Ini" badge={`${allHistory.length} transaksi`}/>
        <div className="space-y-1.5 mt-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {allHistory.length > 0 ? (
            allHistory.map(t => (
              <TxItem
                key={t.id}
                t={t}
                isInv={false}
                walletName={walletData?.find(w => w.id === t.wallet_id)?.name}
              />
            ))
          ) : (
            <div className="py-8"><Empty icon={<CalendarX size={36} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Tidak ada transaksi bulan ini" /></div>
          )}
        </div>
      </div>
    </div>
  )
}