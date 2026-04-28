import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, BriefcaseBusiness, CalendarDays, CalendarCheck2, PieChart, ChevronLeft, ChevronRight, CreditCard, Target } from 'lucide-react'

const NAV_LINKS = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { path: '/transaksi', icon: <ReceiptText size={20} />, label: 'Transaksi' },
  { path: '/investasi', icon: <BriefcaseBusiness size={20} />, label: 'Investasi' },
  { path: '/bulanan', icon: <CalendarDays size={20} />, label: 'Bulanan' },
  { path: '/tahunan', icon: <CalendarCheck2 size={20} />, label: 'Tahunan' },
  { path: '/grafik', icon: <PieChart size={20} />, label: 'Grafik' },
  { path: '/target', icon: <Target size={20} />, label: 'Target Cerdas' },
  { path: '/hutang', icon: <CreditCard size={20} />, label: 'Hutang' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside className={`h-full bg-surface border-r border-border flex flex-col transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* HEADER SIDEBAR */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className={`font-black tracking-tight text-xl text-text flex items-center gap-2 ${collapsed ? 'hidden' : 'block'}`}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm">D</div>
          DompetKu <span className="text-income">Pro</span>
        </div>
        {collapsed && <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm mx-auto font-black">D</div>}
      </div>

      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface border border-border2 rounded-full flex items-center justify-center text-muted2 hover:text-income z-10 transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* MENU SIDEBAR */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
        <p className={`text-[10px] font-bold text-muted2 uppercase tracking-widest mb-3 ml-3 ${collapsed ? 'text-center ml-0' : ''}`}>Menu Utama</p>
        
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-income-light text-income font-bold' 
                : 'text-muted hover:bg-bg hover:text-text font-medium'}
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
      <div className="p-4 border-t border-border m-3 bg-bg rounded-2xl">
        {!collapsed ? (
          <div className="text-center">
            <p className="text-xs font-bold text-text mb-1">Butuh Bantuan?</p>
            <p className="text-[10px] text-muted leading-tight mb-3">Baca panduan lengkap fitur DompetKu Pro.</p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">Lihat Panduan</button>
          </div>
        ) : (
          <div className="flex justify-center text-income"><LayoutDashboard size={20} /></div>
        )}
      </div>
    </aside>
  )
}
