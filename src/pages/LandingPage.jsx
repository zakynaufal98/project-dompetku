import { BarChart3, ShieldCheck, Wallet, TrendingUp, ArrowRight, Zap, Target, CreditCard, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkline-grad)" />
      <path d={line} stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DonutChart() {
  const r = 35, cx = 45, cy = 45
  const circ = 2 * Math.PI * r
  const segs = [
    { pct: 0.55, color: '#14B8A6' },
    { pct: 0.30, color: '#A855F7' },
    { pct: 0.15, color: '#F59E0B' },
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

function MiniBarChart({ color = '#4F46E5' }) {
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
      <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-white/10 to-primary/5 rounded-[60px] blur-3xl" />

      {/* Main card */}
      <div className="relative bg-surface border border-border rounded-[28px] shadow-2xl overflow-hidden">
        {/* Gradient header */}
        <div className="bg-[#0e0f0c] p-5 relative overflow-hidden">
          <GrainOverlay id="grain-card" opacity={0.07} />
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-primary/70 text-xs font-medium mb-1">Total Saldo</p>
              <p className="text-primary text-[26px] font-black tracking-tight leading-none">Rp 24.580.000</p>
            </div>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-text">
              <Wallet size={16} />
            </div>
          </div>
          <AreaSparkline />
          <div className="flex justify-between mt-1.5">
            <span className="text-primary/70 text-[11px]">Jan</span>
            <span className="text-primary/70 text-[11px]">Jun</span>
            <span className="text-white text-[11px] font-bold">↑ 18.4%</span>
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
              <p className="text-[11px] font-bold shrink-0" style={{ color: tx.pos ? '#14B8A6' : '#A855F7' }}>{tx.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating: donut allocation */}
      <div className="hidden sm:flex absolute -right-10 top-16 bg-surface border border-border rounded-2xl shadow-xl p-3 items-center gap-3">
        <DonutChart />
        <div className="space-y-1">
          {[
            { color: '#14B8A6', label: 'Hemat 55%' },
            { color: '#A855F7', label: 'Keluar 30%' },
            { color: '#F59E0B', label: 'Invest 15%' },
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
          <span className="text-[10px] text-muted">Progress</span>
          <span className="text-[10px] font-bold" style={{ color: '#14B8A6' }}>78%</span>
        </div>
        <div className="h-1.5 bg-bg rounded-full overflow-hidden border border-border">
          <div className="h-full rounded-full" style={{ width: '78%', backgroundColor: '#14B8A6' }} />
        </div>
        <p className="text-[10px] text-muted mt-1.5">Rp 39jt / 50jt</p>
      </div>

      {/* Floating: investment badge */}
      <div className="hidden sm:flex absolute -top-4 left-12 rounded-full px-3 py-1.5 shadow-lg items-center gap-1.5"
        style={{ background: 'linear-gradient(to right, #F59E0B, #D97706)' }}>
        <TrendingUp size={10} className="text-white" />
        <span className="text-[10px] font-bold text-white">IHSG +2.4% ↑</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans overflow-x-hidden text-text">

      {/* ── NAV ── */}
      <nav aria-label="Navigasi utama" className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg/95 px-6 py-4 backdrop-blur-xl md:px-14">
        <a href="/" className="flex items-center gap-2.5 no-underline" aria-label="DompetKu Pro – Beranda">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-text shadow-sm">
            <Wallet size={17} />
          </div>
          <div className="hidden sm:flex items-baseline gap-0.5">
            <span className="font-black text-lg tracking-tight text-text">DompetKu Pro</span>
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
            aria-label="Masuk ke akun DompetKu Pro"
            className="min-h-[40px] rounded-full border border-text bg-surface px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-primary-pale cursor-pointer"
          >
            Masuk
          </button>
          <button
            onClick={() => navigate('/register')}
            aria-label="Daftar akun DompetKu Pro gratis"
            className="min-h-[40px] rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-text shadow-lg shadow-primary/20 transition-all hover:bg-primary-light cursor-pointer"
          >
            Mulai Gratis
          </button>
        </div>
      </nav>

      <main id="main-content" aria-label="Halaman utama DompetKu Pro">

        {/* ── HERO ── */}
        <section aria-labelledby="hero-heading" className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-16 md:px-14 md:pt-24">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px] -z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-income/6 rounded-full blur-[100px] -z-10 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/6 rounded-full blur-[80px] -z-10 pointer-events-none" aria-hidden="true" />

          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            {/* Left: text */}
            <div className="flex-1 max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-text bg-surface px-3.5 py-2 animate-fade-up">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold tracking-wider text-text">GRATIS SELAMANYA • TANPA KARTU KREDIT</span>
              </div>

              <h1 id="hero-heading" className="mb-7 text-5xl font-black leading-[0.98] tracking-tight animate-fade-up sm:text-6xl md:text-[72px]" style={{ animationDelay: '80ms' }}>
                Kendalikan uangmu.
                <br className="hidden sm:block" />
                Wujudkan targetmu.
                <span className="mt-2 block text-primary">Dengan tenang.</span>
              </h1>

              <p className="text-xl text-muted font-medium leading-relaxed mb-9 max-w-lg animate-fade-up" style={{ animationDelay: '160ms' }}>
                Catat, analisis, dan kelola keuangan pribadi dengan cara yang paling mudah. Platform finansial #1 untuk milenial Indonesia.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
                <button
                  onClick={() => navigate('/register')}
                  aria-label="Mulai gunakan DompetKu Pro sekarang"
                  className="min-h-[52px] bg-primary text-white px-9 py-3.5 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 hover:bg-primary-light hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  Mulai Sekarang — Gratis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
                <button
                  onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                  aria-label="Pelajari fitur"
                  className="min-h-[52px] border-2 border-border bg-transparent px-9 py-3.5 rounded-2xl text-base font-bold hover:border-primary/30 hover:bg-surface transition-all cursor-pointer text-text"
                >
                  Lihat Fitur
                </button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 animate-fade-up" style={{ animationDelay: '320ms' }}>
                <div className="flex -space-x-2">
                  {[
                    { bg: '#14B8A6', l: 'A' }, { bg: '#A855F7', l: 'B' },
                    { bg: '#4F46E5', l: 'C' }, { bg: '#F59E0B', l: 'D' }, { bg: '#EC4899', l: 'E' },
                  ].map(({ bg, l }) => (
                    <div key={l} className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-[11px] font-black text-white"
                      style={{ backgroundColor: bg }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {Array(5).fill(0).map((_, i) => (
                      <svg key={i} viewBox="0 0 12 12" fill="#F59E0B" className="w-3 h-3">
                        <path d="M6 0l1.5 4.5H12l-3.75 2.7 1.5 4.5L6 9l-3.75 2.7 1.5-4.5L0 4.5h4.5z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-muted">Dipercaya <strong className="text-text font-bold">10.000+</strong> pengguna aktif</p>
                </div>
              </div>
            </div>

            {/* Right: dashboard */}
            <div className="w-full max-w-[360px] mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
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
        <section id="features" aria-labelledby="features-heading" className="py-24 px-6 md:px-14">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                style={{ backgroundColor: 'rgba(79,70,229,0.08)', borderColor: 'rgba(79,70,229,0.2)' }}>
                <Zap size={11} className="text-primary" aria-hidden="true" />
                <span className="text-primary text-xs font-bold tracking-wide">FITUR UNGGULAN</span>
              </div>
              <h2 id="features-heading" className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Semua yang Kamu Butuhkan<br />
                <span className="font-light text-muted">dalam Satu Aplikasi</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

              {/* 1. Pencatatan — large */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #14B8A6, #0d9488)' }}>
                  <Zap size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">
                  Pencatatan <span style={{ color: '#14B8A6' }}>Instan</span>
                </h3>
                <p className="text-muted leading-relaxed mb-6">
                  Tambah transaksi hanya dalam 3 detik. Kategorisasi otomatis dan rekap harian yang selalu akurat.
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
                      <p className="text-xs font-bold shrink-0" style={{ color: tx.pos ? '#14B8A6' : '#A855F7' }}>{tx.a}</p>
                    </div>
                  ))}
                </div>
              </article>

              {/* 2. Laporan Visual */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
                  <BarChart3 size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black mb-3 tracking-tight">
                  Laporan <span className="text-primary">Visual</span>
                </h3>
                <p className="text-muted leading-relaxed mb-6">
                  Grafik interaktif yang langsung menunjukkan pola pengeluaran dan tabungan kamu setiap bulan.
                </p>
                <MiniBarChart color="#4F46E5" />
                <div className="flex justify-between mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map(m => (
                    <span key={m} className="text-[10px] text-muted">{m}</span>
                  ))}
                </div>
              </article>

              {/* 3. Investasi */}
              <article className="md:col-span-2 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #d97706)' }}>
                  <TrendingUp size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">
                  Pantau <span style={{ color: '#F59E0B' }}>Investasi</span>
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-4">Saham, reksadana, emas & kripto dalam satu tempat.</p>
                <div className="space-y-2">
                  {[
                    { label: 'Saham', val: '+12.4%', color: '#14B8A6' },
                    { label: 'Emas', val: '+5.1%', color: '#F59E0B' },
                    { label: 'Reksa Dana', val: '+8.7%', color: '#4F46E5' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center bg-bg rounded-xl px-3 py-2 border border-border">
                      <span className="text-xs font-medium text-text-2">{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </article>

              {/* 4. Privasi — gradient */}
              <article className="md:col-span-2 rounded-3xl p-7 relative overflow-hidden hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                <GrainOverlay id="grain-priv" opacity={0.06} />
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                  <ShieldCheck size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">Privasi <span className="text-emerald-100">Terjamin</span></h3>
                <p className="text-emerald-100 text-sm leading-relaxed">Enkripsi end-to-end. Data kamu tidak pernah dijual ke pihak ketiga.</p>
                <div className="mt-5 flex gap-2 flex-wrap">
                  {['SSL', 'AES-256', 'GDPR Ready'].map(b => (
                    <span key={b} className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/30">{b}</span>
                  ))}
                </div>
              </article>

              {/* 5. Target Cerdas */}
              <article className="md:col-span-2 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #7c3aed)' }}>
                  <Target size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">
                  Target <span style={{ color: '#A855F7' }}>Cerdas</span>
                </h3>
                <p className="text-muted text-sm leading-relaxed mb-4">Buat target finansial dan pantau progres secara real-time.</p>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-muted">Dana Darurat</span>
                    <span className="text-xs font-bold" style={{ color: '#A855F7' }}>78%</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden border border-border">
                    <div className="h-full rounded-full" style={{ width: '78%', backgroundColor: '#A855F7' }} />
                  </div>
                </div>
              </article>

              {/* 6. Hutang */}
              <article className="md:col-span-3 bg-surface border border-border rounded-3xl p-7 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
                  <CreditCard size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2">Kelola <span className="text-rose-500">Hutang & Cicilan</span></h3>
                <p className="text-muted text-sm leading-relaxed">Pantau cicilan KPR, kartu kredit, dan pinjaman. Notifikasi otomatis sebelum jatuh tempo agar tidak pernah terlambat bayar.</p>
              </article>

              {/* 7. AI Insights — dark */}
              <article className="md:col-span-3 bg-text rounded-3xl p-7 relative overflow-hidden hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-300">
                <GrainOverlay id="grain-insight" opacity={0.06} />
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
                  <Sparkles size={20} className="text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black mb-2 text-white">AI <span className="text-indigo-300">Insights</span></h3>
                <p className="text-white/55 text-sm leading-relaxed">Saran keuangan personal berdasarkan pola pengeluaran kamu. Ditenagai AI untuk keputusan yang lebih cerdas setiap hari.</p>
              </article>

            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" aria-labelledby="steps-heading" className="py-24 px-6 md:px-14 bg-surface border-y border-border relative overflow-hidden">
          <GrainOverlay id="grain-how" opacity={0.025} />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

          <div className="max-w-7xl mx-auto">
            <div className="mb-16 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                style={{ backgroundColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.2)' }}>
                <Sparkles size={11} style={{ color: '#A855F7' }} aria-hidden="true" />
                <span className="text-xs font-bold" style={{ color: '#A855F7' }}>CARA KERJA</span>
              </div>
              <h2 id="steps-heading" className="text-4xl md:text-5xl font-black tracking-tight">
                Mulai dalam<br />
                <span className="text-primary">3 Langkah Mudah.</span>
              </h2>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0">
              {[
                {
                  num: '01', title: 'Buat Akun Gratis',
                  desc: 'Daftar dengan email dalam hitungan detik. Tidak perlu kartu kredit, tidak ada biaya tersembunyi.',
                  grad: 'linear-gradient(135deg, #14B8A6, #0d9488)',
                  glow: 'rgba(20,184,166,0.25)',
                  badge: { bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.2)', color: '#14B8A6' },
                },
                {
                  num: '02', title: 'Catat Setiap Hari',
                  desc: 'Masukkan pemasukan dan pengeluaran kamu. AI kami mengkategorikan secara otomatis untuk hemat waktu.',
                  grad: 'linear-gradient(135deg, #6366f1, #4338ca)',
                  glow: 'rgba(99,102,241,0.25)',
                  badge: { bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.2)', color: '#4F46E5' },
                },
                {
                  num: '03', title: 'Raih Kebebasan Finansial',
                  desc: 'Baca insight personal, ikuti saran cerdas, dan wujudkan target finansimu satu per satu.',
                  grad: 'linear-gradient(135deg, #F59E0B, #d97706)',
                  glow: 'rgba(245,158,11,0.25)',
                  badge: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#F59E0B' },
                },
              ].map((step, i) => (
                <li key={i} className="relative group">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-[-50%] h-px border-t-2 border-dashed border-border" aria-hidden="true" />
                  )}
                  <div className="bg-bg border border-border rounded-3xl p-7 group-hover:shadow-card-md transition-all duration-300 group-hover:-translate-y-1 h-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                      style={{ background: step.grad, boxShadow: `0 8px 24px ${step.glow}` }}>
                      <span className="text-white font-black text-sm">{step.num}</span>
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
        <section id="cta-section" aria-labelledby="cta-heading" className="py-24 px-6 md:px-14">
          <div className="max-w-5xl mx-auto">
            <div className="bg-text rounded-[36px] p-10 md:p-14 relative overflow-hidden">
              <GrainOverlay id="grain-cta" opacity={0.05} />
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(79,70,229,0.3)' }} aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'rgba(20,184,166,0.2)' }} aria-hidden="true" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse" />
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>BERGABUNG SEKARANG</span>
                  </div>
                  <h2 id="cta-heading" className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                    Siap Mengubah Cara<br />Kamu Mengelola Uang?
                  </h2>
                  <p className="text-base max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Bergabung dengan 10.000+ pengguna yang sudah merasakan manfaat DompetKu Pro.
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 shrink-0 w-full md:w-auto" style={{ minWidth: 220 }}>
                  <button
                    onClick={() => navigate('/register')}
                    aria-label="Buat akun DompetKu Pro gratis sekarang"
                    className="min-h-[52px] bg-white text-text px-8 py-4 rounded-2xl text-base font-bold shadow-2xl hover:scale-105 transition-transform cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    Buat Akun — Gratis
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    aria-label="Masuk ke akun yang sudah ada"
                    className="min-h-[52px] border text-sm font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
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
      <footer aria-label="Footer DompetKu Pro" className="bg-surface border-t border-border py-10 px-6 md:px-14">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
              <Wallet size={13} className="text-white" />
            </div>
            <span className="font-black text-base">DompetKu <span className="text-primary">Pro</span></span>
          </div>
          <div className="flex items-center gap-6">
            {['Privasi', 'Syarat', 'Kontak'].map(item => (
              <a key={item} href="#" className="text-muted text-sm hover:text-text transition-colors no-underline font-medium">
                {item}
              </a>
            ))}
          </div>
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} DompetKu Pro. Dibuat dengan ❤️ untuk Indonesia.
          </p>
        </div>
      </footer>
    </div>
  )
}
