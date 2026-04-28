import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, BriefcaseBusiness, CalendarDays, CalendarCheck2, PieChart, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'

const NAV_LINKS = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/transaksi', icon: <ReceiptText size={20} />, label: 'Transaksi' },
  { path: '/investasi', icon: <BriefcaseBusiness size={20} />, label: 'Investasi' },
  { path: '/bulanan', icon: <CalendarDays size={20} />, label: 'Bulanan' },
  { path: '/tahunan', icon: <CalendarCheck2 size={20} />, label: 'Tahunan' },
  { path: '/grafik', icon: <PieChart size={20} />, label: 'Grafik' },
  { path: '/hutang', icon: <CreditCard size={20} />, label: 'Hutang' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    // Tambahan dark:bg-[#1E2336] dan dark:border-slate-800
    <aside className={`h-full bg-white dark:bg-[#1E2336] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* HEADER SIDEBAR */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
        <div className={`font-black tracking-tight text-xl text-slate-800 dark:text-white flex items-center gap-2 ${collapsed ? 'hidden' : 'block'}`}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm">D</div>
          DompetKu <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
        </div>
        {collapsed && <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm mx-auto font-black">D</div>}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 z-10 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* MENU SIDEBAR */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
        <p className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-3 ${collapsed ? 'text-center ml-0' : ''}`}>Menu Utama</p>
        
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium'}
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? link.label : ''}
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}>
                  {link.icon}
                </div>
                {!collapsed && <span>{link.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER SIDEBAR */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 m-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Butuh Bantuan?</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mb-3">Baca panduan lengkap fitur DompetKu Pro.</p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">Lihat Panduan</button>
          </div>
        ) : (
          <div className="flex justify-center text-indigo-600 dark:text-indigo-400"><LayoutDashboard size={20} /></div>
        )}
      </div>
    </aside>
  )
}