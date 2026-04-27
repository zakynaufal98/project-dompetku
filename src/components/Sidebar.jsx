import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  TrendingUp, 
  Calendar, 
  CalendarDays, 
  PieChart, 
  ChevronLeft, 
  ChevronRight,
  BanknoteArrowDown
} from 'lucide-react'

const MENU = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/transaksi', icon: <ArrowRightLeft size={20} />, label: 'Transaksi' },
  { path: '/investasi', icon: <TrendingUp size={20} />, label: 'Investasi' },
  { path: '/bulanan', icon: <Calendar size={20} />, label: 'Bulanan' },
  { path: '/tahunan', icon: <CalendarDays size={20} />, label: 'Tahunan' },
  { path: '/grafik', icon: <PieChart size={20} />, label: 'Grafik' },
  { path: '/hutang', icon: <BanknoteArrowDown size={20} />, label: 'Hutang' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const loc = useLocation()

  // Gaya untuk item navigasi
  const navClass = (isActive) => `
    flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer
    ${isActive 
      ? 'bg-indigo-50 text-indigo-600 font-bold' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold'
    }
    ${collapsed ? 'justify-center' : ''}
  `

  return (
    <aside className={`
      sticky top-0 left-0 z-50 h-[100dvh] bg-white border-r border-slate-200 
      flex flex-col transition-all duration-300
      ${collapsed ? 'w-[88px]' : 'w-[260px]'}
    `}>
      
      {/* ── TOMBOL COLLAPSE ──────────────────────────────── */}
      {/* Posisi dinaikkan ke top-8 karena header logo sudah dihapus */}
      <div className="absolute -right-3 top-8 z-10">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* ── MENU UTAMA ──────────────────────────────────── */}
      {/* Ditambahkan pt-8 agar menu tidak menabrak atap layar */}
      <div className="flex-1 overflow-y-auto pt-8 pb-6 px-4 space-y-1.5 custom-scrollbar">
        <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2 ${collapsed ? 'text-center pl-0' : ''}`}>
          {collapsed ? 'Menu' : 'Main Menu'}
        </p>
        
        {MENU.map(m => {
          const isActive = loc.pathname === m.path
          return (
            <Link key={m.path} to={m.path} className={navClass(isActive)} title={collapsed ? m.label : ''}>
              <span className="flex-shrink-0">{m.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{m.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* ── PROMO/INFO BANNER ───────────────────────────── */}
      {!collapsed && (
        <div className="px-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-[20px] p-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl" />
            <p className="text-xs font-bold text-indigo-800 mb-1">Butuh Bantuan?</p>
            <p className="text-[11px] text-indigo-600/80 leading-relaxed mb-3">Baca panduan lengkap fitur DompetKu Pro.</p>
            <button className="text-[11px] font-bold text-white bg-indigo-500 px-3 py-1.5 rounded-lg w-full shadow-sm hover:bg-indigo-600 transition-colors">
              Lihat Panduan
            </button>
          </div>
        </div>
      )}
      
    </aside>
  )
}