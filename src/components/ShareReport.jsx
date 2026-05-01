import { useRef, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Sparkles, Loader2, Flame, Trophy, ChevronRight, ChevronLeft, Target, TrendingUp, TrendingDown, CalendarDays, BarChart3 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmtShort, MONTHS_FULL } from '../lib/utils'

export default function ShareReport() {
  const { txData, invData, totals } = useData()
  const reportRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [mode, setMode] = useState('bulanan') // 'bulanan' | 'tahunan'

  // --- LOGIKA DATA ---
  const stats = useMemo(() => {
    const now = new Date()
    const currYear = now.getFullYear()
    const currYM = `${currYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastYM_date = new Date(currYear, now.getMonth() - 1, 1)
    const lastYM = `${lastYM_date.getFullYear()}-${String(lastYM_date.getMonth() + 1).padStart(2, '0')}`
    
    const periodPrefix = mode === 'tahunan' ? String(currYear) : currYM
    const lastPeriodPrefix = mode === 'tahunan' ? String(currYear - 1) : lastYM
    const periodLabel = mode === 'tahunan' ? `Tahun ${currYear}` : `${MONTHS_FULL[now.getMonth()]} ${currYear}`
    
    const expenses = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(periodPrefix))
    const incomes = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(periodPrefix))
    
    const totalOut = expenses.reduce((s, t) => s + t.amount, 0)
    const totalIn = incomes.reduce((s, t) => s + t.amount, 0)
    const netto = totalIn - totalOut
    
    // Periode sebelumnya
    const lastOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(lastPeriodPrefix)).reduce((s, t) => s + t.amount, 0)
    const lastIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(lastPeriodPrefix)).reduce((s, t) => s + t.amount, 0)
    
    const outChange = lastOut > 0 ? ((totalOut - lastOut) / lastOut * 100).toFixed(0) : 0
    const inChange = lastIn > 0 ? ((totalIn - lastIn) / lastIn * 100).toFixed(0) : 0
    
    // Top kategori
    const catMap = {}
    expenses.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount })
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topCat = topCats[0]?.[0] || 'Lainnya'

    // Investasi
    const invTotal = invData.filter(t => t.action === 'beli' && t.date?.startsWith(periodPrefix)).reduce((s, t) => s + t.amount, 0)
    
    // Savings rate
    const savingsRate = totalIn > 0 ? ((netto > 0 ? netto : 0) / totalIn * 100).toFixed(0) : 0

    // Title
    let title = "Si Paling Hemat 😇"
    if (totalOut > 5000000) title = "Menteri Keuangan Bocor 💸"
    else if (totalOut > 2000000) title = "Sobat Survive ✊"
    if (topCat === 'Konsumsi & Makan') title = "Duta Kuliner 🍜"
    if (Number(savingsRate) >= 30) title = "Pro Investor 🚀"

    return { 
      totalOut, totalIn, netto, topCat, topCats, freq: expenses.length, title, 
      periodLabel, outChange, inChange, invTotal, savingsRate,
      lastPeriodLabel: mode === 'tahunan' ? `${currYear - 1}` : MONTHS_FULL[lastYM_date.getMonth()]
    }
  }, [txData, invData, mode])

  const handleShare = async () => {
    if (!reportRef.current) return
    setIsCapturing(true)
    try {
      const dataUrl = await toPng(reportRef.current, { quality: 1, pixelRatio: 3 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `wrapped-${mode}-slide-${activeSlide + 1}.png`, { type: blob.type })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const link = document.createElement('a')
        link.download = `wrapped-${mode}-slide-${activeSlide + 1}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCapturing(false)
    }
  }

  // --- RENDER SLIDES ---
  const slides = [
    // SLIDE 1: OVERVIEW
    <div key="s1" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-rose-600/30 blur-[80px]" aria-hidden="true"></div>
      <div className="absolute bottom-[-15%] left-[-15%] w-[60%] h-[40%] rounded-full bg-indigo-600/20 blur-[60px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 1 / 4</p>
        <h1 className="text-4xl font-black italic tracking-tighter">WRAPPED</h1>
        <p className="text-[11px] font-bold text-white/50 mt-1 uppercase tracking-widest">{stats.periodLabel}</p>
      </div>
      <div className="relative z-10 space-y-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-6 text-center">
          <Trophy className="text-yellow-400 mx-auto mb-3" size={40} />
          <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Gelarmu</p>
          <p className="text-xl font-black">{stats.title}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold text-white/40 mb-1 uppercase">Total Pengeluaran</p>
          <p className="text-4xl font-black text-rose-400 tabular-nums">{fmtShort(stats.totalOut)}</p>
        </div>
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>,

    // SLIDE 2: CASHFLOW
    <div key="s2" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-teal-600/20 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 2 / 4</p>
        <h1 className="text-4xl font-black italic tracking-tighter">CASHFLOW</h1>
      </div>
      <div className="relative z-10 space-y-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-white/50 uppercase">Pemasukan</p>
            <span className={`text-[10px] font-black ${Number(stats.inChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number(stats.inChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(stats.inChange))}% vs {stats.lastPeriodLabel}
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400 tabular-nums">+{fmtShort(stats.totalIn)}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-white/50 uppercase">Pengeluaran</p>
            <span className={`text-[10px] font-black ${Number(stats.outChange) <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Number(stats.outChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(stats.outChange))}% vs {stats.lastPeriodLabel}
            </span>
          </div>
          <p className="text-2xl font-black text-rose-400 tabular-nums">-{fmtShort(stats.totalOut)}</p>
        </div>
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 backdrop-blur-md border border-white/10 rounded-[24px] p-5 text-center">
          <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Netto</p>
          <p className={`text-3xl font-black tabular-nums ${stats.netto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtShort(stats.netto)}</p>
        </div>
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>,

    // SLIDE 3: HABITS
    <div key="s3" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-600/30 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 3 / 4</p>
        <h1 className="text-4xl font-black italic tracking-tighter">HABITS</h1>
      </div>
      <div className="relative z-10 space-y-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5">
          <Flame className="text-orange-400 mb-2" size={24} />
          <p className="text-[10px] font-bold text-white/50 uppercase">Frekuensi Transaksi</p>
          <p className="text-2xl font-black">{stats.freq} Kali</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5">
          <BarChart3 className="text-indigo-400 mb-2" size={24} />
          <p className="text-[10px] font-bold text-white/50 uppercase mb-2">Top 3 Pengeluaran</p>
          <div className="space-y-2">
            {stats.topCats.map(([cat, val], i) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2">
                  <span className="text-xs text-white/40">{i + 1}.</span> {cat}
                </span>
                <span className="text-xs font-black text-rose-400 tabular-nums">{fmtShort(val)}</span>
              </div>
            ))}
          </div>
        </div>
        {stats.invTotal > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-5">
            <Target className="text-emerald-400 mb-2" size={24} />
            <p className="text-[10px] font-bold text-white/50 uppercase">Total Investasi</p>
            <p className="text-2xl font-black text-emerald-400">{fmtShort(stats.invTotal)}</p>
          </div>
        )}
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>,

    // SLIDE 4: BALANCE
    <div key="s4" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white relative overflow-hidden">
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-emerald-600/20 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 4 / 4</p>
        <h1 className="text-4xl font-black italic tracking-tighter">BALANCE</h1>
      </div>
      <div className="relative z-10 text-center space-y-5">
        <p className="text-sm font-medium text-white/70 italic">"Uang bisa dicari, tapi diskon belum tentu datang lagi."</p>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-6">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Savings Rate</p>
          <p className="text-5xl font-black text-yellow-400 tabular-nums">{stats.savingsRate}%</p>
          <p className="text-[10px] font-medium text-white/40 mt-2">dari total pemasukanmu berhasil diamankan</p>
        </div>

        <div className="py-5 border-y border-white/10">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Saldo Akhir</p>
          <p className="text-3xl font-black text-emerald-400 tabular-nums">{fmtShort(totals.saldo)}</p>
        </div>
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>
  ]

  return (
    <section 
      className="bg-surface border border-border rounded-[32px] p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10"
      aria-labelledby="wrapped-title"
    >
      <div className="flex-1 space-y-6">
        <div>
          <h2 id="wrapped-title" className="text-3xl md:text-4xl font-black text-text tracking-tight mb-3">
            Dompetku <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-rose-500">Wrapped</span>
          </h2>
          <p className="text-muted text-sm md:text-base max-w-sm">
            Pilih mode dan slide yang ingin kamu pamerkan. Share langsung ke Instagram Story!
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button onClick={() => { setMode('bulanan'); setActiveSlide(0) }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'bulanan' ? 'bg-income text-white shadow-lg shadow-income/20' : 'bg-bg text-muted border border-border2 hover:text-text'}`}>
            <CalendarDays size={14} className="inline mr-1.5" /> Bulanan
          </button>
          <button onClick={() => { setMode('tahunan'); setActiveSlide(0) }} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'tahunan' ? 'bg-income text-white shadow-lg shadow-income/20' : 'bg-bg text-muted border border-border2 hover:text-text'}`}>
            <BarChart3 size={14} className="inline mr-1.5" /> Tahunan
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleShare} 
            disabled={isCapturing} 
            className="btn-primary px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-none shadow-xl shadow-indigo-500/20 w-full md:w-fit focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all active:scale-95"
            aria-label={`Bagikan Slide ${activeSlide + 1} ke media sosial`}
          >
            {isCapturing ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Share2 size={20} aria-hidden="true" />}
            <span>{isCapturing ? 'Memotret...' : `Share Slide ${activeSlide + 1}`}</span>
          </button>
          
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest text-center md:text-left" aria-live="polite">
            💡 Tips: Geser kartu dan klik share lagi untuk slide lainnya
          </p>
        </div>
      </div>

      <div className="relative group" role="region" aria-label="Carousel Laporan">
        {/* Navigasi Carousel */}
        <button 
          onClick={() => setActiveSlide(s => s === 0 ? slides.length - 1 : s - 1)}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white dark:bg-slate-800 shadow-lg rounded-full flex items-center justify-center text-text hover:scale-110 transition-transform border border-border focus:ring-2 focus:ring-indigo-500"
          aria-label="Slide sebelumnya"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setActiveSlide(s => s === slides.length - 1 ? 0 : s + 1)}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white dark:bg-slate-800 shadow-lg rounded-full flex items-center justify-center text-text hover:scale-110 transition-transform border border-border focus:ring-2 focus:ring-indigo-500"
          aria-label="Slide berikutnya"
        >
          <ChevronRight size={24} />
        </button>

        {/* Frame Preview */}
        <div 
          className="w-[280px] rounded-[32px] overflow-hidden shadow-2xl border-8 border-bg" 
          style={{ aspectRatio: '9/16' }}
          aria-live="auto"
        >
          <div ref={reportRef} className="w-full h-full" aria-hidden="true">
            {slides[activeSlide]}
          </div>
        </div>

        {/* Indikator Titik */}
        <div className="flex justify-center gap-2 mt-4" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i} 
              onClick={() => setActiveSlide(i)}
              className={`h-2 rounded-full transition-all ${activeSlide === i ? 'bg-indigo-500 w-5' : 'bg-slate-300 w-2 hover:bg-slate-400'}`} 
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}