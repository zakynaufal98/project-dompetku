import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, BriefcaseBusiness, BarChart3, ChevronLeft, ChevronRight, CreditCard, Target, Sparkles, Wallet } from 'lucide-react'
import PanduanModal from './PanduanModal'

const NAV_LINKS = [
  { path: '/',          icon: LayoutDashboard,  label: 'Dashboard', color: '#6366f1' },
  { path: '/transaksi', icon: ReceiptText,       label: 'Transaksi', color: '#14B8A6' },
  { path: '/investasi', icon: BriefcaseBusiness, label: 'Investasi', color: '#F59E0B' },
  { path: '/laporan',   icon: BarChart3,         label: 'Laporan',   color: '#A855F7' },
  { path: '/insights',  icon: Sparkles,          label: 'Insights',  color: '#EC4899' },
  { path: '/target',    icon: Target,            label: 'Target',    color: '#10B981' },
  { path: '/hutang',    icon: CreditCard,        label: 'Hutang',    color: '#f43f5e' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const [showPanduan, setShowPanduan] = useState(false)

  return (
    <>
    <aside
      className={`h-full bg-surface border-r border-border flex flex-col transition-all duration-300 relative ${collapsed ? 'w-[72px]' : 'w-60'}`}
      aria-label="Sidebar Navigasi"
    >
      {/* ── HEADER ── */}
      <div className={`h-16 flex items-center border-b border-border flex-shrink-0 ${collapsed ? 'justify-center px-4' : 'px-5'}`}>
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
          >
            <Wallet size={15} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-black text-base tracking-tight text-text whitespace-nowrap">
              DompetKu <span className="text-primary">Pro</span>
            </span>
          )}
        </div>
      </div>

      {/* ── TOGGLE ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.5rem] w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center text-muted hover:text-primary z-10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label={collapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
      >
        {collapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
      </button>

      {/* ── NAV ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5 custom-scrollbar" aria-label="Menu Utama">
        {!collapsed && (
          <p className="text-[9px] font-bold text-muted uppercase tracking-[0.15em] mb-3 px-2" aria-hidden="true">
            Navigasi
          </p>
        )}

        {NAV_LINKS.map(({ path, icon: Icon, label, color }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            aria-label={label}
            title={collapsed ? label : ''}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
              ${isActive ? 'font-bold' : 'text-muted hover:bg-bg hover:text-text font-medium'}
              ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: color, opacity: 0.1 }}
                  />
                )}
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                  style={{ color: isActive ? color : undefined }}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </span>
                {!collapsed && (
                  <span className="text-sm" style={{ color: isActive ? color : undefined }}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── FOOTER ── */}
      <div className="p-3 border-t border-border flex-shrink-0">
        {!collapsed ? (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.04))',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <p className="text-[11px] font-black text-text mb-0.5">Butuh Bantuan?</p>
            <p className="text-[10px] text-muted leading-tight mb-3">Panduan lengkap DompetKu Pro.</p>
            <button
              onClick={() => setShowPanduan(true)}
              className="w-full py-2 text-white text-[11px] font-bold rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}
              aria-label="Lihat Panduan Fitur"
            >
              Lihat Panduan
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPanduan(true)}
            className="w-full h-10 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-primary/5 transition-colors"
            title="Lihat Panduan"
            aria-label="Lihat Panduan"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="7" />
              <path d="M6 6a2 2 0 114 0c0 1-1 1.5-2 2v1" />
              <circle cx="8" cy="12" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
      </div>
    </aside>
    {showPanduan && <PanduanModal onClose={() => setShowPanduan(false)} />}
    </>
  )
}
