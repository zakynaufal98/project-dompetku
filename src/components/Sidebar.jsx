import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  TrendingUp, 
  Calendar, 
  CalendarDays, 
  PieChart, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react'

const MENU = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/transaksi', icon: <ArrowRightLeft size={20} />, label: 'Transaksi' },
  { path: '/investasi', icon: <TrendingUp size={20} />, label: 'Investasi' },
  { path: '/bulanan', icon: <Calendar size={20} />, label: 'Bulanan' },
  { path: '/tahunan', icon: <CalendarDays size={20} />, label: 'Tahunan' },
  { path: '/grafik', icon: <PieChart size={20} />, label: 'Grafik' },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const loc = useLocation()
  const { user, logout } = useAuth()

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
    <>
      {/* OVERLAY UNTUK MOBILE */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-[100dvh] bg-white border-r border-slate-200 
        flex flex-col transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:shadow-none
        ${collapsed ? 'w-[88px]' : 'w-[260px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* ── HEADER & LOGO ───────────────────────────────── */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            {/* Logo 'D' Merah ala Pro */}
            <div className="w-10 h-10 rounded-xl bg-[#E8353A] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              D
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <span className="font-syne font-black text-xl text-slate-800 leading-none tracking-tight">DompetKu</span>
                <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase mt-0.5">Pro Edition</span>
              </div>
            )}
          </Link>
          
          {/* Tombol Tutup Sidebar (Hanya Muncul di Mobile) */}
          <button 
            className="lg:hidden text-slate-400 hover:text-slate-700 bg-slate-50 p-2 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* ── TOMBOL COLLAPSE (Hanya Desktop) ─────────────── */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all z-10"
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* ── MENU UTAMA ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2 ${collapsed ? 'text-center pl-0' : ''}`}>
            {collapsed ? 'Menu' : 'Main Menu'}
          </p>
          
          {MENU.map(m => {
            const isActive = loc.pathname === m.path
            return (
              <Link key={m.path} to={m.path} onClick={() => setMobileOpen(false)} className={navClass(isActive)} title={collapsed ? m.label : ''}>
                <span className="flex-shrink-0">{m.icon}</span>
                {!collapsed && <span className="whitespace-nowrap">{m.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* ── PROMO/INFO BANNER (Opsional) ────────────────── */}
        {!collapsed && (
          <div className="px-6 mb-6">
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

        {/* ── USER PROFILE & LOGOUT ───────────────────────── */}
        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-2 rounded-xl mb-2 ${collapsed ? 'justify-center' : 'hover:bg-slate-50 transition-colors'}`}>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=f1f5f9&color=475569&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-700 truncate">
                  {user?.user_metadata?.full_name || 'Pengguna Pro'}
                </span>
                <span className="text-[11px] font-medium text-slate-400 truncate">
                  {user?.email}
                </span>
              </div>
            )}
          </div>

          <button onClick={logout}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors w-full cursor-pointer font-bold text-sm ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Keluar' : ''}
          >
            <span className="flex-shrink-0"><LogOut size={18} /></span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}