import { useRef, useState, useMemo } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Sparkles, Loader2, Flame, Trophy, ChevronRight, ChevronLeft, Target } from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmtShort } from '../lib/utils'

export default function ShareReport() {
  const { txData, totals } = useData()
  const reportRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  // --- LOGIKA DATA ---
  const stats = useMemo(() => {
    const now = new Date()
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const expenses = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM))
    
    const total = expenses.reduce((s, t) => s + t.amount, 0)
    const catMap = {}
    expenses.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount })
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Lainnya'

    let title = "Si Paling Hemat 😇"
    if (total > 5000000) title = "Menteri Keuangan Bocor 💸"
    else if (total > 2000000) title = "Sobat Survive ✊"
    if (topCat === 'Konsumsi & Makan') title = "Duta Kuliner 🍜"

    return { total, topCat, freq: expenses.length, title }
  }, [txData])

  const handleShare = async () => {
    if (!reportRef.current) return
    setIsCapturing(true)
    try {
      // Peningkatan pixelRatio ke 3 untuk ketajaman di layar Retina (IG Story)
      const dataUrl = await toPng(reportRef.current, { quality: 1, pixelRatio: 3 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `wrapped-slide-${activeSlide + 1}.png`, { type: blob.type })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] })
      } else {
        const link = document.createElement('a')
        link.download = `wrapped-slide-${activeSlide + 1}.png`
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
    <div key="s1" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white">
      <div className="absolute top-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-rose-600/30 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 1 / 3</p>
        <h1 className="text-4xl font-black italic tracking-tighter">WRAPPED</h1>
      </div>
      <div className="relative z-10 space-y-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-6 text-center">
          <Trophy className="text-yellow-400 mx-auto mb-3" size={40} />
          <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Gelar Bulan Ini</p>
          <p className="text-xl font-black">{stats.title}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold text-white/40 mb-1 uppercase">Total Pengeluaran</p>
          <p className="text-4xl font-black text-rose-400">{fmtShort(stats.total)}</p>
        </div>
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>,

    // SLIDE 2: HABITS
    <div key="s2" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white">
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] rounded-full bg-indigo-600/30 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 2 / 3</p>
        <h1 className="text-4xl font-black italic tracking-tighter">HABITS</h1>
      </div>
      <div className="relative z-10 space-y-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-6">
          <Flame className="text-orange-400 mb-2" size={24} />
          <p className="text-[10px] font-bold text-white/50 uppercase">Frekuensi Jajan</p>
          <p className="text-2xl font-black">{stats.freq} Kali Transaksi</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[24px] p-6">
          <Target className="text-emerald-400 mb-2" size={24} />
          <p className="text-[10px] font-bold text-white/50 uppercase">Kategori Favorit</p>
          <p className="text-2xl font-black">{stats.topCat}</p>
        </div>
      </div>
      <div className="relative z-10 text-center text-[10px] font-bold text-white/30 tracking-widest">DOMPETKU APP</div>
    </div>,

    // SLIDE 3: BALANCE
    <div key="s3" className="w-full h-full p-8 flex flex-col justify-between bg-[#0f172a] text-white">
      <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] rounded-full bg-emerald-600/20 blur-[80px]" aria-hidden="true"></div>
      <div className="relative z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.4em] text-white/40 mb-2 uppercase">Slide 3 / 3</p>
        <h1 className="text-4xl font-black italic tracking-tighter">BALANCE</h1>
      </div>
      <div className="relative z-10 text-center space-y-4">
        <p className="text-sm font-medium text-white/70 italic">"Uang bisa dicari, tapi diskon belum tentu datang lagi."</p>
        <div className="py-6 border-y border-white/10">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Saldo Akhirmu</p>
          <p className="text-3xl font-black text-emerald-400">{fmtShort(totals.saldo)}</p>
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
            Pilih slide yang ingin kamu pamerkan. Klik tombol panah untuk ganti tema laporan.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleShare} 
            disabled={isCapturing} 
            className="btn-primary px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-none shadow-xl shadow-indigo-500/20 w-full md:w-fit focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all active:scale-95"
            aria-label={`Bagikan Slide ${activeSlide + 1} ke media sosial`}
          >
            {isCapturing ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Share2 size={20} aria-hidden="true" />}
            <span>{isCapturing ? 'Memotret...' : `Share Slide ${activeSlide + 1} ke IG`}</span>
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
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full transition-all ${activeSlide === i ? 'bg-indigo-500 w-5' : 'bg-slate-300'}`} 
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  )
}