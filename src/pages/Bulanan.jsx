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
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Ringkasan Bulanan</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted text-sm font-medium">Analisis arus kas per bulan</p>
            <span className="bg-surface border border-border px-2 py-0.5 rounded text-[10px] text-muted2 font-bold uppercase tracking-wider">
              Murni (Tanpa Transfer)
            </span>
          </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm col-span-2 md:col-span-1">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Netto Bulan Ini</p>
          <p className={`tabular-nums font-bold text-3xl tracking-tight ${nettoBulanIni >= 0 ? 'text-text' : 'text-expense'}`}>{fmt(nettoBulanIni)}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* KARTU DISTRIBUSI PENGELUARAN */}
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Distribusi Pengeluaran" />
          <InteractiveDonut data={txBlnOut} />
        </div>

        {/* KARTU PROGRESS BAR (Sisi Kanan) */}
        <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm lg:col-span-3">
          <PanelHeader title="Progress Pengeluaran Utama" />
          {sorted.length > 0 ? (
            <div className="space-y-5 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
          {allHistory.length > 0 ? (
            allHistory.map(t => (
              <TxItem 
                key={t.id} 
                t={t} 
                isInv={false} // Selalu false karena investasi sekarang berbentuk "Transfer" di txData
                walletName={walletData?.find(w => w.id === t.wallet_id)?.name} // Tampilkan dompet
              />
            ))
          ) : (
            <div className="py-8"><Empty icon={<CalendarX size={40} className="text-muted2 mb-2" strokeWidth={1.5} />} text="Tidak ada transaksi bulan ini" /></div>
          )}
        </div>
      </div>
    </div>
  )
}