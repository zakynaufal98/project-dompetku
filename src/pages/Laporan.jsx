import { NavLink, Navigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, CalendarCheck2, PieChart } from 'lucide-react'
import Bulanan from './Bulanan'
import Tahunan from './Tahunan'
import Grafik from './Grafik'

const TABS = [
  { value: 'bulanan', label: 'Bulanan', icon: <CalendarDays size={16} /> },
  { value: 'tahunan', label: 'Tahunan', icon: <CalendarCheck2 size={16} /> },
  { value: 'grafik', label: 'Grafik', icon: <PieChart size={16} /> },
]

export default function Laporan() {
  const { tab = 'bulanan' } = useParams()

  if (!TABS.some((item) => item.value === tab)) {
    return <Navigate to="/laporan/bulanan" replace />
  }

  const CurrentPage = tab === 'tahunan' ? Tahunan : tab === 'grafik' ? Grafik : Bulanan

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Laporan</h1>
          <p className="text-muted text-sm font-medium mt-1">Ringkasan bulanan, tahunan, dan grafik analisis dalam satu tempat.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2 text-xs font-bold text-income w-fit">
          <BarChart3 size={16} />
          Pusat Analisis
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {TABS.map((item) => (
          <NavLink
            key={item.value}
            to={`/laporan/${item.value}`}
            className={({ isActive }) => `
              inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all
              ${isActive ? 'bg-income text-white shadow-md shadow-income/20' : 'bg-surface border border-border text-muted hover:text-text hover:bg-bg'}
            `}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </div>

      <CurrentPage />
    </div>
  )
}
