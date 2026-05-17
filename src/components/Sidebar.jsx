import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, BriefcaseBusiness, BarChart3, ChevronLeft, ChevronRight, CreditCard, Target, Sparkles } from 'lucide-react'
import PanduanModal from './PanduanModal'
import CashFlowKuLogo from './CashFlowKuLogo'

const NAV_LINKS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transaksi', icon: ReceiptText, label: 'Transaksi' },
  { path: '/investasi', icon: BriefcaseBusiness, label: 'Investasi' },
  { path: '/laporan', icon: BarChart3, label: 'Laporan' },
  { path: '/insights', icon: Sparkles, label: 'Insights' },
  { path: '/target', icon: Target, label: 'Target' },
  { path: '/hutang', icon: CreditCard, label: 'Hutang' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const [showPanduan, setShowPanduan] = useState(false)

  return (
    <>
      <aside
        className={`relative flex h-full flex-col border-r border-border bg-bg transition-all duration-300 ${collapsed ? 'w-[86px]' : 'w-[280px]'}`}
        aria-label="Sidebar navigasi"
      >
        <div className={`flex h-[88px] items-center border-b border-border ${collapsed ? 'justify-center px-4' : 'px-6'}`}>
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <CashFlowKuLogo size={48} rounded={24} className="shrink-0 shadow-sm" />
            {!collapsed && (
              <div>
                <p className="text-xl font-black leading-none text-text">CashFlowKu</p>
                <p className="mt-1 text-xs font-medium text-muted">Keuangan pribadi</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[76px] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg text-text shadow-sm transition-colors hover:bg-primary-pale"
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 custom-scrollbar" aria-label="Menu utama">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Navigasi
            </p>
          )}

          {NAV_LINKS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              aria-label={label}
              title={collapsed ? label : ''}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${isActive ? 'bg-surface text-text shadow-sm' : 'text-text-2 hover:bg-surface hover:text-text'}`
              }
            >
              {({ isActive }) => (
                <>
                  {!collapsed && isActive && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary" />}
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-text' : 'group-hover:text-text'}`} />
                  {!collapsed && <span className="text-sm font-bold">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {!collapsed ? (
            <div className="rounded-[24px] bg-surface p-4 shadow-sm">
              <p className="text-sm font-black text-text">Panduan Penggunaan</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Pelajari alur transaksi, tagihan, dan laporan dengan cepat.</p>
              <button onClick={() => setShowPanduan(true)} className="btn-primary mt-4 w-full justify-center">
                Lihat Panduan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPanduan(true)}
              className="flex h-12 w-full items-center justify-center rounded-full bg-surface text-text shadow-sm transition-colors hover:bg-primary-pale"
              title="Lihat panduan"
              aria-label="Lihat panduan"
            >
              <Sparkles size={18} />
            </button>
          )}
        </div>
      </aside>

      {showPanduan && <PanduanModal onClose={() => setShowPanduan(false)} />}
    </>
  )
}
