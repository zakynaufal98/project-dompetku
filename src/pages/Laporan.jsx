import { NavLink, Navigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, CalendarCheck2, PieChart, Sparkles } from 'lucide-react'
import Bulanan from './Bulanan'
import Tahunan from './Tahunan'
import Grafik from './Grafik'
import ExportData from '../components/ExportData'
import BudgetWidget from '../components/BudgetWidget'

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
      
      {/* HEADER */}
      <header className="relative bg-text rounded-[28px] p-7 md:p-9 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.35)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.2)' }} />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 hidden md:flex">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <Sparkles size={10} /> Pusat Analisis
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Laporan Keuangan</h1>
            <p className="text-sm font-medium mt-1.5 max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Evaluasi riwayat transaksimu secara menyeluruh. Simpan dan cetak kapan saja.
            </p>
          </div>
        </div>

        <div className="relative z-50">
          <ExportData isYearly={tab === 'tahunan'} />
        </div>
      </header>

      {/* TAB NAV */}
      <nav aria-label="Navigasi Laporan" className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {TABS.map((item) => (
          <NavLink
            key={item.value}
            to={`/laporan/${item.value}`}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all focus:outline-none
              ${isActive
                ? 'bg-text text-white shadow-sm'
                : 'bg-surface border border-border text-muted hover:text-text hover:bg-bg'}`
            }
            aria-label={`Lihat laporan ${item.label}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* KONTEN */}
      <main id="report-content" aria-live="polite" className="bg-surface border border-border rounded-[28px] p-3 md:p-6 min-h-[500px]">
        <CurrentPage />
      </main>

      {/* Anggaran Bulanan — cocok di sini, user review laporan sambil cek limit anggaran */}
      <BudgetWidget />
      
    </div>
  )
}