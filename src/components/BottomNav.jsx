import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  TrendingUp, 
  Calendar, 
  CalendarDays, 
  PieChart,
  Landmark
} from 'lucide-react'

// Nama label saya persingkat agar muat rapi berjejer 6 di layar HP
const MENU = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Home' },
  { path: '/transaksi', icon: <ArrowRightLeft size={20} />, label: 'Catat' },
  { path: '/investasi', icon: <TrendingUp size={20} />, label: 'Aset' },
  { path: '/bulanan', icon: <Calendar size={20} />, label: 'Bulan' },
  { path: '/tahunan', icon: <CalendarDays size={20} />, label: 'Tahun' },
  { path: '/hutang', label: 'Hutang', icon: <Landmark size={20} /> },
  { path: '/grafik', icon: <PieChart size={20} />, label: 'Grafik' },
]

export default function BottomNav() {
  const loc = useLocation()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-1 pb-2 pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex justify-around items-center h-14">
        {MENU.map(m => {
          const isActive = loc.pathname === m.path
          return (
            <Link key={m.path} to={m.path} className="flex flex-col items-center justify-center w-full space-y-1">
              <div className={`transition-all duration-200 ${isActive ? 'bg-indigo-50 text-indigo-600 p-1.5 rounded-xl' : 'text-slate-400 p-1.5'}`}>
                {m.icon}
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                {m.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 