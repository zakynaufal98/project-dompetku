import { PieChart, BarChart3, ShieldCheck, Wallet, TrendingUp, ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans overflow-x-hidden text-text">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border transition-all">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20">
            D
          </div>
          <span className="font-black text-xl tracking-tight hidden sm:block">DompetKu Pro</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => navigate('/login')} className="px-4 py-2.5 text-sm font-bold text-text-2 hover:text-primary transition-colors cursor-pointer">
            Masuk
          </button>
          <button onClick={() => navigate('/register')} className="bg-text text-bg px-5 sm:px-7 py-2.5 rounded-full text-sm font-bold shadow-xl hover:scale-105 transition-all cursor-pointer">
            Daftar Gratis
          </button>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-32">
        {/* DECORATIVE BLURS */}
        <div className="absolute top-20 left-0 w-96 h-96 bg-income/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-96 h-96 bg-gold/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-xs font-bold mb-8 animate-fade-up shadow-sm">
          <span className="w-2 h-2 rounded-full bg-income animate-pulse"></span>
          <span>Aplikasi Finansial #1 untuk Milenial</span>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-8 animate-fade-up" style={{animationDelay: '100ms'}}>
          Ubah Cara Anda Mengelola <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-income to-gold">Keuangan Pribadi</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted font-medium max-w-2xl mb-12 animate-fade-up leading-relaxed" style={{animationDelay: '200ms'}}>
          Catat pengeluaran, pantau investasi, dan capai kebebasan finansial Anda dengan platform yang dirancang khusus untuk kemudahan, keamanan, dan keindahan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up w-full sm:w-auto" style={{animationDelay: '300ms'}}>
          <button onClick={() => navigate('/register')} className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-full text-base font-bold shadow-xl shadow-primary/30 hover:bg-primary-light hover:-translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2">
            Mulai Sekarang <ArrowRight size={20} />
          </button>
          <button onClick={() => {
            document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
          }} className="w-full sm:w-auto bg-surface px-8 py-4 rounded-full text-base font-bold shadow-sm border border-border hover:bg-bg transition-all cursor-pointer text-text">
            Pelajari Fitur
          </button>
        </div>

        {/* DASHBOARD MOCKUP */}
        <div className="mt-20 w-full max-w-5xl h-[350px] md:h-[500px] bg-gradient-to-b from-surface to-bg rounded-t-[40px] border-t border-x border-border shadow-2xl relative overflow-hidden animate-fade-up group" style={{animationDelay: '400ms'}}>
          <div className="absolute top-0 w-full h-12 bg-surface/80 backdrop-blur border-b border-border flex items-center px-6 gap-2">
            <div className="w-3 h-3 rounded-full bg-expense"></div>
            <div className="w-3 h-3 rounded-full bg-invest"></div>
            <div className="w-3 h-3 rounded-full bg-income"></div>
          </div>
          
          <div className="p-8 md:p-12 h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bg via-surface to-bg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              <div className="h-32 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center shadow-sm gap-2">
                 <Wallet size={32} className="text-income" />
                 <span className="font-bold text-sm">Arus Kas</span>
              </div>
              <div className="h-32 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center shadow-sm gap-2">
                 <BarChart3 size={32} className="text-gold" />
                 <span className="font-bold text-sm">Analitik</span>
              </div>
              <div className="h-32 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center shadow-sm gap-2">
                 <ShieldCheck size={32} className="text-primary" />
                 <span className="font-bold text-sm">Keamanan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section id="features" className="py-24 bg-surface border-y border-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Fitur yang Memudahkan Hidup Anda</h2>
            <p className="text-muted font-medium text-lg max-w-2xl mx-auto">Tidak perlu lagi bingung uang Anda habis kemana. Kami mencatat dan menganalisis semuanya untuk Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Zap size={28} className="text-amber-500" />, title: "Pencatatan Instan", desc: "Catat pengeluaran harian hanya dalam 3 detik. Simpel dan responsif." },
              { icon: <PieChart size={28} className="text-income" />, title: "Laporan Visual", desc: "Grafik cantik yang otomatis merangkum kesehatan finansial Anda." },
              { icon: <TrendingUp size={28} className="text-primary" />, title: "Pantau Investasi", desc: "Kelola portofolio saham, reksadana, dan emas di satu tempat." },
              { icon: <ShieldCheck size={28} className="text-emerald-500" />, title: "Privasi Terjamin", desc: "Data Anda dienkripsi penuh dan tidak akan pernah dibagikan ke pihak ketiga." }
            ].map((f, i) => (
              <div key={i} className="bg-bg p-8 rounded-3xl border border-border hover:shadow-card-md hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-surface rounded-2xl border border-border flex items-center justify-center mb-6 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-text-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-16">Tiga Langkah Menuju Bebas Finansial</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: "01", title: "Daftar Akun", desc: "Buat akun gratis dalam waktu kurang dari 1 menit." },
              { num: "02", title: "Catat Rutin", desc: "Masukkan pemasukan dan pengeluaran Anda setiap hari." },
              { num: "03", title: "Pantau & Analisis", desc: "Lihat grafik perkembangan uang Anda dan buat keputusan cerdas." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center relative">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/20 z-10 relative">
                  {step.num}
                </div>
                {/* Connector Line */}
                {i < 2 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-px border-t-2 border-dashed border-border2"></div>}
                
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-text-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BOTTOM CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary to-gold rounded-[40px] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Siap Mengelola Uang Anda?</h2>
          <p className="text-primary-pale text-lg mb-10 max-w-2xl mx-auto relative z-10">Bergabunglah dengan ribuan milenial lainnya yang telah menggunakan DompetKu Pro untuk mencapai target keuangan mereka.</p>
          <button onClick={() => navigate('/register')} className="bg-white text-primary px-10 py-4 rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform relative z-10 cursor-pointer">
            Buat Akun Sekarang — Gratis
          </button>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-surface border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
              D
            </div>
            <span className="font-bold text-lg">DompetKu Pro</span>
          </div>
          <p className="text-muted text-sm text-center md:text-right">
            © {new Date().getFullYear()} DompetKu Pro. Dibuat dengan cinta untuk masa depan Anda.
          </p>
        </div>
      </footer>
    </div>
  )
}
