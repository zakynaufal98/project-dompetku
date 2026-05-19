import { useRef, useState } from 'react'
import { BarChart3, ShieldCheck, TrendingUp, ArrowRight, Zap, Target, CreditCard, Sparkles, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isAndroidShell } from '../lib/platform'
import CashFlowKuLogo from '../components/CashFlowKuLogo'

const ANDROID_ONBOARDING = [
  {
    eyebrow: 'Kelola lebih tenang',
    title: 'Semua uangmu, lebih mudah dipahami.',
    body: 'Catat pemasukan, pengeluaran, dan target keuangan tanpa terasa ramai.',
    points: ['Potong pengeluaran yang tidak perlu', 'Tabungan tumbuh lebih terarah', 'Semua dompet di satu tempat'],
  },
  {
    eyebrow: 'Pantau arus kas',
    title: 'Lihat ringkasan bulanan dalam sekali geser.',
    body: 'CashFlowKu membantu kamu membaca saldo, pengeluaran, dan pola belanja lebih cepat.',
    points: ['Pemasukan riil vs pengeluaran bersih', 'Tagihan dan target tetap terpantau', 'Laporan lebih gampang dipahami'],
  },
  {
    eyebrow: 'Mulai dalam hitungan detik',
    title: 'Masuk atau daftar saat kamu siap.',
    body: 'Pilih alur yang paling cocok. Setelah itu baru masuk ke dashboard dan transaksi.',
    points: ['Login email atau Google', 'Akun baru langsung siap dipakai', 'Tampilan dibuat lebih ramah untuk Android'],
  },
]

function GrainOverlay({ id = 'grain', opacity = 0.04 }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg width="100%" height="100%" style={{ opacity }}>
        <defs>
          <filter id={id}>
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </div>
  )
}

function AreaSparkline() {
  const pts = [20, 35, 28, 50, 42, 65, 55, 70, 60, 80]
  const w = 240, h = 56
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map(v => h - (v / 100) * h)
  const line = pts.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const area = `${line} L ${w} ${h} L 0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} fill="none" className="w-full" style={{ height: 48 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fe870" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#9fe870" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkline-grad)" />
      <path d={line} stroke="#9fe870" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DonutChart() {
  const r = 35, cx = 45, cy = 45
  const circ = 2 * Math.PI * r
  const segs = [
    { pct: 0.55, color: '#2ead4b' },
    { pct: 0.30, color: '#d03238' },
    { pct: 0.15, color: '#ffd11a' },
  ]
  let cumPct = 0
  return (
    <svg viewBox="0 0 90 90" className="w-20 h-20" style={{ transform: 'rotate(-90deg)' }}>
      {segs.map((seg, i) => {
        const offset = cumPct
        cumPct += seg.pct
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${(seg.pct * circ).toFixed(2)} ${circ.toFixed(2)}`}
            strokeDashoffset={`${-(offset * circ).toFixed(2)}`}
          />
        )
      })}
    </svg>
  )
}

function MiniBarChart({ color = '#9fe870' }) {
  const data = [35, 55, 42, 78, 52, 88, 65, 72, 60, 90, 75, 85]
  const max = 90
  const barW = 14, gap = 4
  const svgW = data.length * (barW + gap) - gap
  const svgH = 48
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} fill="none" className="w-full" style={{ height: 48 }}>
      {data.map((v, i) => {
        const bh = (v / max) * svgH * 0.95
        return (
          <rect key={i}
            x={i * (barW + gap)} y={svgH - bh}
            width={barW} height={bh} rx="3"
            fill={i === data.length - 1 ? color : `${color}55`}
          />
        )
      })}
    </svg>
  )
}

function DashboardPreview() {
  return (
    <div className="relative w-full select-none" aria-hidden="true" role="presentation">
      <div className="hidden sm:block absolute -inset-6 bg-gradient-to-br from-primary/20 via-white/10 to-primary/5 rounded-[60px] blur-3xl" />

      {/* Main card */}
      <div className="relative bg-surface border border-border rounded-[28px] shadow-2xl overflow-hidden">
        {/* Dark header band */}
        <div className="bg-[#0e0f0c] p-5 relative overflow-hidden">
          <GrainOverlay id="grain-card" opacity={0.07} />
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-primary/70 text-xs font-medium mb-1">Total Saldo</p>
              <p className="text-primary text-[26px] font-black tracking-tight leading-none">Rp 24.580.000</p>
            </div>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-[#0e0f0c]">
              <Wallet size={16} />
            </div>
          </div>
          <AreaSparkline />
          <div className="flex justify-between mt-1.5">
            <span className="text-primary/70 text-[11px]">Jan</span>
            <span className="text-primary/70 text-[11px]">Jun</span>
            <span className="text-primary text-[11px] font-bold">↑ 18.4%</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {[
            { label: 'Pemasukan', value: 'Rp 8.5jt', color: '#2ead4b' },
            { label: 'Keluar', value: 'Rp 3.2jt', color: '#d03238' },
            { label: 'Investasi', value: 'Rp 2.1jt', color: '#38c8ff' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 text-center">
              <p className="text-xs font-bold" style={{ color }}>{value}</p>
              <p className="text-muted text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="p-4">
          <p className="text-[11px] font-bold text-text-2 mb-3 uppercase tracking-wide">Transaksi Terbaru</p>
          {[
            { e: '🛒', n: 'Belanja Groceries', a: '-180.000', pos: false },
            { e: '⚡', n: 'Token Listrik', a: '-200.000', pos: false },
            { e: '💰', n: 'Freelance Design', a: '+2.500.000', pos: true },
          ].map((tx) => (
            <div key={tx.n} className="flex items-center gap-3 py-1.5">
              <div className="w-8 h-8 bg-bg rounded-xl flex items-center justify-center text-sm border border-border shrink-0">{tx.e}</div>
              <p className="flex-1 text-[11px] font-semibold text-text truncate">{tx.n}</p>
              <p className="text-[11px] font-bold shrink-0" style={{ color: tx.pos ? '#2ead4b' : '#d03238' }}>{tx.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating: donut allocation */}
      <div className="hidden sm:flex absolute -right-10 top-16 bg-surface border border-border rounded-2xl shadow-xl p-3 items-center gap-3">
        <DonutChart />
        <div className="space-y-1">
          {[
            { color: '#2ead4b', label: 'Hemat 55%' },
            { color: '#d03238', label: 'Keluar 30%' },
            { color: '#ffd11a', label: 'Invest 15%' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-semibold text-text-2">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating: progress */}
      <div className="hidden sm:block absolute -left-10 bottom-20 bg-surface border border-border rounded-2xl shadow-xl p-3.5 w-40">
        <p className="text-[10px] font-bold text-text-2 mb-2">🎯 Dana Darurat</p>
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-muted">Progres</span>
          <span className="text-[10px] font-bold" style={{ color: '#2ead4b' }}>78%</span>
        </div>
        <div className="h-1.5 bg-bg rounded-full overflow-hidden border border-border">
          <div className="h-full rounded-full" style={{ width: '78%', backgroundColor: '#2ead4b' }} />
        </div>
        <p className="text-[10px] text-muted mt-1.5">Rp 39jt / 50jt</p>
      </div>

      {/* Floating: investment badge */}
      <div className="hidden sm:flex absolute -top-4 left-12 rounded-full px-3 py-1.5 shadow-lg items-center gap-1.5"
        style={{ background: 'linear-gradient(to right, #ffd11a, #b86700)' }}>
        <TrendingUp size={10} className="text-[#0e0f0c]" />
        <span className="text-[10px] font-bold text-[#0e0f0c]">IHSG +2.4% ↑</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const androidShell = isAndroidShell()
  const [activeSlide, setActiveSlide] = useState(0)
  const slideRef = useRef(null)
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const scrollToSlide = (index) => {
    const container = slideRef.current
    if (!container) return
    container.scrollTo({ left: container.clientWidth * index, behavior: 'smooth' })
    setActiveSlide(index)
  }

  if (androidShell) {
    return (
      <div
        className="min-h-[100dvh] bg-surface text-text flex flex-col"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)', paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <CashFlowKuLogo size={44} rounded={14} className="shadow-sm" />
            <div>
              <p className="text-xl font-black tracking-tight text-income">CashFlowKu</p>
            </div>
          </div>
        </div>

        <div
          ref={slideRef}
          onScroll={(e) => {
            const width = e.currentTarget.clientWidth || 1
            setActiveSlide(Math.round(e.currentTarget.scrollLeft / width))
          }}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto px-5"
          style={{ scrollbarWidth: 'none' }}
        >
          {ANDROID_ONBOARDING.map((item, idx) => (
            <section key={item.title} className="flex min-w-full snap-center flex-col py-6">
              <div className="flex-1 pt-6">
                <div className="mb-10 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">{item.eyebrow}</span>
                </div>

                <div className="mx-auto max-w-[320px]">
                  <div className="mb-10 space-y-4">
                    {item.points.map((point, pointIndex) => (
                      <div key={point} className="flex items-center gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                          pointIndex === 0 ? 'bg-primary-pale text-income' : pointIndex === 1 ? 'bg-invest-light text-invest' : 'bg-gold-light text-gold'
                        }`}>
                          {pointIndex === 0 ? <Sparkles size={22} /> : pointIndex === 1 ? <Target size={22} /> : <Wallet size={22} />}
                        </div>
                        <p className="text-lg font-medium leading-snug text-text">{point}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 text-center">
                    <h1 className="text-[2rem] font-black leading-tight tracking-tight text-text">
                      {item.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[300px] text-base leading-relaxed text-muted">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="px-5 pb-1 pt-2">
          <div className="mb-7 flex justify-center gap-2">
            {ANDROID_ONBOARDING.map((_, dotIndex) => (
              <button
                key={`dot-${dotIndex}`}
                type="button"
                onClick={() => scrollToSlide(dotIndex)}
                aria-label={`Buka slide ${dotIndex + 1}`}
                className={`h-2.5 rounded-full transition-all ${activeSlide === dotIndex ? 'w-6 bg-primary' : 'w-2.5 bg-border'}`}
              />
            ))}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn-primary flex w-full justify-center"
            >
              SIGN UP FOR FREE
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn-secondary flex w-full justify-center border-none bg-transparent shadow-none"
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans overflow-x-hidden text-text">

      {/* ── NAV ── */}
      <nav
        aria-label="Navigasi utama"
        className={`sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg/95 px-6 py-4 backdrop-blur-xl md:px-14 ${
          androidShell ? 'pt-5' : ''
        }`}
        style={androidShell ? { paddingTop: 'max(env(safe-area-inset-top), 1rem)' } : undefined}
      >
        <a href="/" className="flex items-center gap-2.5 no-underline" aria-label="CashFlowKu – Beranda">
          <CashFlowKuLogo size={44} rounded={22} className="shadow-sm" />
          <div className="hidden sm:flex items-baseline gap-0.5">
            <span className="font-black text-lg tracking-tight text-text">CashFlowKu</span>
          </div>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Fitur', id: 'features' },
            { label: 'Cara Kerja', id: 'how-it-works' },
            { label: 'Tentang', id: 'cta-section' },
          ].map(({ label, id }) => (
            <button key={label} onClick={() => scrollTo(id)} className="rounded-full border-none bg-transparent px-4 py-2 text-sm font-bold text-text-2 transition-colors hover:bg-primary-pale hover:text-text cursor-pointer">
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/login')}
            aria-label="Masuk ke akun CashFlowKu"
            className="min-h-[40px] rounded-full border border-text bg-surface px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-primary-pale cursor-pointer"
          >
            Masuk
          </button>
          <button
            onClick={() => navigate('/register')}
            aria-label="Daftar akun CashFlowKu gratis"
            className="min-h-[40px] rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[#0e0f0c] shadow-lg shadow-primary/20 transition-all hover:bg-primary-light cursor-pointer"
          >
            Mulai Gratis
          </button>
        </div>
      </nav>

      <main id="main-content" aria-label="Halaman utama CashFlowKu">

        {/* ── HERO ── */}
        <section aria-labelledby="hero-heading" className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-10 sm:pb-20 sm:pt-16 md:px-14 md:pt-24 md:pb-24">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px] -z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-income/6 rounded-full blur-[100px] -z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/6 rounded-full blur-[80px] -z-10 pointer-events-none" aria-hidden="true" />

          <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* Left: text */}
            <div className="flex-1 max-w-2xl">
              <div className="mb-5 sm:mb-7 flex w-fit max-w-full items-center gap-2 rounded-full border border-text bg-surface px-3 py-1.5 sm:px-3.5 sm:py-2 animate-fade-up overflow-hidden">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold tracking-wider text-text truncate">GRATIS SELAMANYA • TANPA KARTU KREDIT</span>
              </div>

              <h1 id="hero-heading" className="mb-5 sm:mb-7 text-[1.75rem] leading-[1.15] font-black tracking-tight animate-fade-up sm:text-5xl sm:leading-[0.98] md:text-[72px]" style={{ animationDelay: '80ms' }}>
                Kendalikan uangmu.
                <br className="hidden sm:block" />
                Wujudkan targetmu.
                <span className="mt-1 sm:mt-2 block text-primary">Dengan tenang.</span>
              </h1>

              <p className="text-base sm:text-xl text-muted font-medium leading-relaxed mb-7 sm:mb-9 max-w-lg animate-fade-up" style={{ animationDelay: '160ms' }}>
                Catat pemasukan, pengeluaran, tagihan, investasi, dan target dalam satu tempat yang rapi.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-7 sm:mb-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
                <button
                  onClick={() => navigate('/register')}
                  aria-label="Mulai gunakan CashFlowKu sekarang"
                  className="min-h-[48px] sm:min-h-[52px] bg-primary text-[#0e0f0c] px-7 sm:px-9 py-3 sm:py-3.5 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 hover:bg-primary-light hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  Mulai Sekarang — Gratis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
                <button
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  aria-label="Pelajari fitur"
                  className="min-h-[48px] sm:min-h-[52px] border-2 border-border bg-transparent px-7 sm:px-9 py-3 sm:py-3.5 rounded-2xl text-base font-bold hover:border-primary/30 hover:bg-surface transition-all cursor-pointer text-text"
                >
                  Lihat Fitur
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: '320ms' }}>
                <div className="flex -space-x-2">
                  {[
                    { bg: '#2ead4b', l: 'A', dark: false },
                    { bg: '#d03238', l: 'B', dark: false },
                    { bg: '#38c8ff', l: 'C', dark: true },
                    { bg: '#ffd11a', l: 'D', dark: true },
                    { bg: '#9fe870', l: 'E', dark: true },
                  ].map(({ bg, l, dark }) => (
                    <div key={l} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-surface flex items-center justify-center text-[10px] sm:text-[11px] font-black"
                      style={{ backgroundColor: bg, color: dark ? '#0e0f0c' : '#ffffff' }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {Array(5).fill(0).map((_, i) => (
                      <svg key={i} viewBox="0 0 12 12" fill="#ffd11a" className="w-3 h-3">
                        <path d="M6 0l1.5 4.5H12l-3.75 2.7 1.5 4.5L6 9l-3.75 2.7 1.5-4.5L0 4.5h4.5z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-muted">Dipercaya <strong className="text-text font-bold">10.000+</strong> pengguna aktif</p>
                </div>
              </div>
            </div>

            {/* Right: dashboard */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="border-y border-border bg-surface/60 py-4 px-6" aria-label="Keunggulan platform">
          <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-x-8 gap-y-2">
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest">Keunggulan Kami</p>
            {['🔒 Enkripsi End-to-End', '☁️ Backup Otomatis', '📱 Multi-Device', '⚡ Realtime Sync', '🆓 Gratis Selamanya'].map(b => (
              <span key={b} className="text-[11px] font-semibold text-muted">{b}</span>
            ))}
          </div>
        </div>

        {/* ── FEATURES BENTO ── */}
        <section id="features" aria-labelledby="features-heading" className="py-14 md:py-24 px-6 md:px-14">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 md:mb-5"
                style={{ backgroundColor: 'rgba(159,232,112,0.15)', borderColor: 'rgba(159,232,112,0.35)' }}>
                <Zap size={11} className="text-primary" aria-hidden="true" />
                <span className="text-primary text-xs font-bold tracking-wide">FITUR UNGGULAN</span>
              </div>
              <h2 id="features-heading" className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Semua yang Kamu Butuhkan<br />
                <span className="font-light text-muted">dalam Satu Aplikasi</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

              {/* 1. Pencatatan — large */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2ead4b, #054d28)' }}>
                  <Zap size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">
                  Pencatatan <span style={{ color: '#2ead4b' }}>Instan</span>
                </h3>
                <p className="text-muted leading-relaxed mb-6">
                  Tambah transaksi dengan cepat. Riwayat kategori membantu pencatatan berikutnya lebih ringkas.
                </p>
                <div className="bg-bg rounded-2xl p-4 border border-border space-y-2.5">
                  {[
                    { e: '🛒', n: 'Belanja Groceries', a: '-Rp 180.000', pos: false },
                    { e: '⚡', n: 'Token Listrik', a: '-Rp 200.000', pos: false },
                    { e: '💰', n: 'Freelance Design', a: '+Rp 2.500.000', pos: true },
                  ].map(tx => (
                    <div key={tx.n} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface rounded-xl flex items-center justify-center text-sm border border-border shrink-0">{tx.e}</div>
                      <p className="flex-1 text-xs font-semibold text-text truncate">{tx.n}</p>
                      <p className="text-xs font-bold shrink-0" style={{ color: tx.pos ? '#2ead4b' : '#d03238' }}>{tx.a}</p>
                    </div>
                  ))}
                </div>
              </article>

              {/* 2. Laporan Visual */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #38c8ff, #0891b2)' }}>
                  <BarChart3 size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">
                  Laporan <span style={{ color: '#38c8ff' }}>Visual</span>
                </h3>
                <p className="text-muted leading-relaxed mb-6">
                  Grafik interaktif yang langsung menunjukkan pola pengeluaran dan tabungan kamu setiap bulan.
                </p>
                <MiniBarChart color="#9fe870" />
                <div className="flex justify-between mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map(m => (
                    <span key={m} className="text-[10px] text-muted">{m}</span>
                  ))}
                </div>
              </article>

              {/* 3. Investasi */}
              <article className="md:col-span-2 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #ffd11a, #b86700)' }}>
                  <TrendingUp size={20} className="text-[#0e0f0c]" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">
                  Pantau <span style={{ color: '#b86700' }}>Investasi</span>
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-4">Saham, reksadana, emas & kripto dalam satu tempat.</p>
                <div className="space-y-2">
                  {[
                    { label: 'Saham', val: '+12.4%', color: '#2ead4b' },
                    { label: 'Emas', val: '+5.1%', color: '#b86700' },
                    { label: 'Reksa Dana', val: '+8.7%', color: '#38c8ff' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center bg-bg rounded-xl px-3 py-2 border border-border">
                      <span className="text-xs font-medium text-text-2">{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </article>

              {/* 4. Privasi — primary-pale card */}
              <article className="md:col-span-2 bg-primary-pale border border-border rounded-3xl p-7 relative overflow-hidden hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-[#0e0f0c] flex items-center justify-center mb-5">
                  <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2 text-text">Privasi <span style={{ color: '#054d28' }}>Terjamin</span></h3>
                <p className="text-text-2 text-sm leading-relaxed">Enkripsi end-to-end. Data kamu tidak pernah dijual ke pihak ketiga.</p>
                <div className="mt-5 flex gap-2 flex-wrap">
                  {['SSL', 'AES-256', 'GDPR Ready'].map(b => (
                    <span key={b} className="bg-[#0e0f0c] text-primary text-[10px] font-bold px-2 py-1 rounded-full">{b}</span>
                  ))}
                </div>
              </article>

              {/* 5. Target */}
              <article className="md:col-span-2 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #9fe870, #2ead4b)' }}>
                  <Target size={20} className="text-[#0e0f0c]" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">
                  Target <span className="text-primary">Keuangan</span>
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-4">Buat target dan lihat sisa dana yang perlu dikumpulkan.</p>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-muted">Dana Darurat</span>
                    <span className="text-xs font-bold text-primary">78%</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: '78%' }} />
                  </div>
                </div>
              </article>

              {/* 6. Hutang */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #d03238, #a72027)' }}>
                  <CreditCard size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">Kelola <span style={{ color: '#d03238' }}>Hutang & Cicilan</span></h3>
                <p className="text-muted text-sm leading-relaxed">Catat cicilan KPR, kartu kredit, dan pinjaman. Tanggal bayar jadi lebih mudah dicek.</p>
              </article>

              {/* 7. AI Insights — dark */}
              <article className="md:col-span-3 bg-text rounded-3xl p-7 relative overflow-hidden hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <GrainOverlay id="grain-insight" opacity={0.06} />
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
                  <Sparkles size={20} className="text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">Kondisi <span className="text-primary">Keuangan</span></h3>
                <p className="text-white/55 text-sm leading-relaxed">Lihat catatan bulan ini dari pemasukan, pengeluaran, tagihan, dan anggaran.</p>
              </article>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" aria-labelledby="steps-heading" className="py-14 md:py-24 px-6 md:px-14 bg-surface border-y border-border relative overflow-hidden">
          <GrainOverlay id="grain-how" opacity={0.025} />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

          <div className="max-w-7xl mx-auto">
            <div className="mb-10 md:mb-16 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 md:mb-5"
                style={{ backgroundColor: 'rgba(255,209,26,0.1)', borderColor: 'rgba(255,209,26,0.3)' }}>
                <Sparkles size={11} style={{ color: '#b86700' }} aria-hidden="true" />
                <span className="text-xs font-bold" style={{ color: '#b86700' }}>CARA KERJA</span>
              </div>
              <h2 id="steps-heading" className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
                Mulai dalam<br />
                <span className="text-primary">3 Langkah Mudah.</span>
              </h2>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0">
              {[
                {
                  num: '01', title: 'Buat Akun Gratis',
                  desc: 'Daftar dengan email dalam hitungan detik. Tidak perlu kartu kredit, tidak ada biaya tersembunyi.',
                  grad: 'linear-gradient(135deg, #2ead4b, #054d28)',
                  glow: 'rgba(46,173,75,0.25)',
                  badge: { bg: 'rgba(46,173,75,0.1)', border: 'rgba(46,173,75,0.25)', color: '#2ead4b' },
                },
                {
                  num: '02', title: 'Catat Setiap Hari',
                  desc: 'Masukkan pemasukan dan pengeluaran kamu. Riwayat kategori membantu pencatatan berikutnya lebih cepat.',
                  grad: 'linear-gradient(135deg, #38c8ff, #0891b2)',
                  glow: 'rgba(56,200,255,0.25)',
                  badge: { bg: 'rgba(56,200,255,0.1)', border: 'rgba(56,200,255,0.25)', color: '#0891b2' },
                },
                {
                  num: '03', title: 'Raih Kebebasan Finansial',
                  desc: 'Baca catatan bulan ini dan wujudkan target finansimu satu per satu.',
                  grad: 'linear-gradient(135deg, #ffd11a, #b86700)',
                  glow: 'rgba(255,209,26,0.25)',
                  badge: { bg: 'rgba(255,209,26,0.1)', border: 'rgba(255,209,26,0.3)', color: '#b86700' },
                },
              ].map((step, i) => (
                <li key={i} className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-[-50%] h-px border-t-2 border-dashed border-border" aria-hidden="true" />
                  )}
                  <div className="bg-bg border border-border rounded-3xl p-7 group-hover:shadow-card-md transition-all duration-300 group-hover:-translate-y-1 h-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                      style={{ background: step.grad, boxShadow: `0 8px 24px ${step.glow}` }}>
                      <span className="font-black text-sm" style={{ color: i === 2 ? '#0e0f0c' : '#ffffff' }}>{step.num}</span>
                    </div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold mb-4"
                      style={{ backgroundColor: step.badge.bg, borderColor: step.badge.border, color: step.badge.color }}>
                      Langkah {i + 1}
                    </div>
                    <h3 className="text-xl font-black mb-3">{step.title}</h3>
                    <p className="text-muted leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="cta-section" aria-labelledby="cta-heading" className="py-14 md:py-24 px-4 sm:px-6 md:px-14">
          <div className="max-w-5xl mx-auto">
            <div className="bg-text rounded-[28px] sm:rounded-[36px] p-7 sm:p-10 md:p-14 relative overflow-hidden">
              <GrainOverlay id="grain-cta" opacity={0.05} />
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(159,232,112,0.25)' }} aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(46,173,75,0.2)' }} aria-hidden="true" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 md:mb-5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse" />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>BERGABUNG SEKARANG</span>
                  </div>
                  <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4 leading-tight tracking-tight">
                    Siap Mengubah Cara<br />Kamu Mengelola Uang?
                  </h2>
                  <p className="text-sm sm:text-base max-w-sm mx-auto md:mx-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Bergabung dengan 10.000+ pengguna yang sudah merasakan manfaat CashFlowKu.
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 shrink-0 w-full md:w-auto" style={{ minWidth: 200 }}>
                  <button
                    onClick={() => navigate('/register')}
                    aria-label="Buat akun CashFlowKu gratis sekarang"
                    className="min-h-[48px] sm:min-h-[52px] bg-primary text-[#0e0f0c] px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base font-bold shadow-2xl hover:scale-105 transition-transform cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    Buat Akun — Gratis
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    aria-label="Masuk ke akun yang sudah ada"
                    className="min-h-[44px] border text-sm font-semibold px-6 sm:px-8 py-3 rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}
                  >
                    Sudah punya akun? Masuk
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer aria-label="Footer CashFlowKu" className="bg-text border-t border-border py-10 px-6 md:px-14">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <CashFlowKuLogo size={32} rounded={9} />
            <span className="font-black text-base text-bg">CashFlow<span className="text-primary">Ku</span></span>
          </div>
          <div className="flex items-center gap-6">
            {['Privasi', 'Syarat', 'Kontak'].map(item => (
              <a key={item} href="#" className="text-muted2 text-sm hover:text-bg transition-colors no-underline font-medium">
                {item}
              </a>
            ))}
          </div>
          <p className="text-muted2 text-sm">
            © {new Date().getFullYear()} CashFlowKu. Dibuat dengan ❤️ untuk Indonesia.
          </p>
        </div>
      </footer>
    </div>
  )
}
