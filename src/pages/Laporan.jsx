import { useState } from 'react'
import { NavLink, Navigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, CalendarCheck2, PieChart, Sparkles, BookOpen } from 'lucide-react'
import Bulanan from './Bulanan'
import Tahunan from './Tahunan'
import Grafik from './Grafik'
import ExportData from '../components/ExportData'
import BudgetWidget from '../components/BudgetWidget'
import FinancialDefinitionsModal from '../components/FinancialDefinitionsModal'
import { QUICK_FILTERS } from '../lib/utils'

const TABS = [
  { value: 'bulanan', label: 'Bulanan', icon: <CalendarDays size={16} aria-hidden="true" /> },
  { value: 'tahunan', label: 'Tahunan', icon: <CalendarCheck2 size={16} aria-hidden="true" /> },
  { value: 'grafik', label: 'Grafik', icon: <PieChart size={16} aria-hidden="true" /> },
]

export default function Laporan() {
  const { tab = 'bulanan' } = useParams()
  const [quickFilter, setQuickFilter] = useState('semua')
  const [showDefinitions, setShowDefinitions] = useState(false)

  if (!TABS.some((item) => item.value === tab)) {
    return <Navigate to="/laporan/bulanan" replace />
  }

  const CurrentPage = tab === 'tahunan' ? Tahunan : tab === 'grafik' ? Grafik : Bulanan

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      <header className="relative flex flex-col gap-5 rounded-[28px] bg-text p-7 text-white md:flex-row md:items-center md:justify-between md:p-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]" aria-hidden="true">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.35)' }} />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.2)' }} />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 md:flex">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <Sparkles size={10} /> Pusat Analisis
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Laporan Keuangan</h1>
            <p className="mt-1.5 max-w-md text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Evaluasi riwayat transaksimu secara menyeluruh. Simpan dan cetak kapan saja.
            </p>
          </div>
        </div>

        <div className="relative z-50">
          <ExportData isYearly={tab === 'tahunan'} />
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {QUICK_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setQuickFilter(item.value)}
              className={`rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                quickFilter === item.value
                  ? 'bg-text text-white'
                  : 'border border-border bg-surface text-text hover:bg-bg'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowDefinitions(true)}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-bg"
        >
          <BookOpen size={14} />
          Pusat definisi keuangan
        </button>
      </div>

      <nav aria-label="Navigasi Laporan" className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {TABS.map((item) => (
          <NavLink
            key={item.value}
            to={`/laporan/${item.value}`}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all focus:outline-none ${
                isActive
                  ? 'bg-text text-white shadow-sm'
                  : 'bg-surface border border-border text-muted hover:text-text hover:bg-bg'
              }`
            }
            aria-label={`Lihat laporan ${item.label}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main id="report-content" aria-live="polite" className="min-h-[500px] rounded-[28px] border border-border bg-surface p-3 md:p-6">
        <CurrentPage quickFilter={quickFilter} />
      </main>

      <BudgetWidget />
      <FinancialDefinitionsModal open={showDefinitions} onClose={() => setShowDefinitions(false)} />
    </div>
  )
}
