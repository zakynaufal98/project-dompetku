import { NavLink, Navigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, CalendarCheck2, PieChart, Sparkles } from 'lucide-react'
import Bulanan from './Bulanan'
import Tahunan from './Tahunan'
import Grafik from './Grafik'
import ExportData from '../components/ExportData'

const TABS = [
  { value: 'bulanan', label: 'Bulanan', icon: <CalendarDays size={16} aria-hidden="true" /> },
  { value: 'tahunan', label: 'Tahunan', icon: <CalendarCheck2 size={16} aria-hidden="true" /> },
  { value: 'grafik', label: 'Grafik', icon: <PieChart size={16} aria-hidden="true" /> },
]

export default function Laporan() {
  const { tab = 'bulanan' } = useParams()

  if (!TABS.some((item) => item.value === tab)) {
    return <Navigate to="/laporan/bulanan" replace />
  }

  const CurrentPage = tab === 'tahunan' ? Tahunan : tab === 'grafik' ? Grafik : Bulanan

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* HEADER HERO (Perbaikan pada class overflow) */}
      <header className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-[32px] p-8 md:p-10 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Dekorasi Glow (Dibungkus div khusus overflow-hidden agar blur rapi, tapi dropdown aman) */}
        <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-black/10 blur-[60px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner hidden md:flex">
            <BarChart3 size={28} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-white/20">
              <Sparkles size={12} /> Pusat Analisis
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm">Laporan Keuangan</h1>
            <p className="text-white/80 text-sm font-medium mt-1.5 max-w-md">
              Evaluasi riwayat transaksimu secara menyeluruh. Simpan dan cetak laporan kapan saja.
            </p>
          </div>
        </div>

        {/* Tombol Export Premium */}
        <div className="relative z-50">
          <ExportData />
        </div>
      </header>

      {/* NAVIGASI TAB */}
      <nav aria-label="Navigasi Laporan" className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 pt-2">
        {TABS.map((item) => (
          <NavLink
            key={item.value}
            to={`/laporan/${item.value}`}
            className={({ isActive }) => `
              inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-income/50
              ${isActive 
                ? 'bg-income text-white shadow-lg shadow-income/20 scale-100' 
                : 'bg-surface border border-border text-muted hover:text-text hover:bg-bg hover:border-border2 scale-95 hover:scale-100'}
            `}
            aria-label={`Lihat laporan ${item.label}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* KONTEN HALAMAN UTAMA - Area ini yang akan difoto jadi PDF */}
      <main id="report-content" aria-live="polite" className="bg-surface border border-border rounded-[32px] p-2 md:p-6 shadow-sm min-h-[500px]">
        <CurrentPage />
      </main>
      
    </div>
  )
}