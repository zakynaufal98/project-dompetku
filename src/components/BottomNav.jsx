import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  TrendingUp, 
  BarChart3,
  Landmark,
  Target
} from 'lucide-react'

// Nama label saya persingkat agar muat rapi berjejer 6 di layar HP
const MENU = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Home' },
  { path: '/transaksi', icon: <ArrowRightLeft size={20} />, label: 'Catat' },
  { path: '/investasi', icon: <TrendingUp size={20} />, label: 'Aset' },
  { path: '/laporan', icon: <BarChart3 size={20} />, label: 'Laporan' },
  { path: '/hutang', label: 'Hutang', icon: <Landmark size={20} /> },
  { path: '/target', icon: <Target size={20} />, label: 'Target' },
]

export default function BottomNav() {
  const loc = useLocation()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 px-1 pb-2 pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] transition-colors">
      <div className="flex items-center h-14 overflow-x-auto custom-scrollbar">
        {MENU.map(m => {
          const isActive = m.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(m.path)
          return (
            <Link key={m.path} to={m.path} className="flex flex-col items-center justify-center min-w-[58px] flex-1 space-y-1">
              <div className={`transition-all duration-200 ${isActive ? 'bg-income-light text-income p-1.5 rounded-xl' : 'text-muted2 p-1.5'}`}>
                {m.icon}
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-income' : 'text-muted'}`}>
                {m.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 
