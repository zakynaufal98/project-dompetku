import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ReceiptText, BriefcaseBusiness, BarChart3, Menu, CreditCard, Target, Sparkles } from 'lucide-react'
import PanduanModal from './PanduanModal'
import CashFlowKuLogo from './CashFlowKuLogo'

const NAV_LINKS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transaksi', icon: ReceiptText, label: 'Transaksi' },
  { path: '/investasi', icon: BriefcaseBusiness, label: 'Investasi' },
  { path: '/laporan', icon: BarChart3, label: 'Laporan' },
  { path: '/insights', icon: Sparkles, label: 'Kondisi' },
  { path: '/target', icon: Target, label: 'Target' },
  { path: '/hutang', icon: CreditCard, label: 'Hutang' },
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const [showPanduan, setShowPanduan] = useState(false)

  return (
    <>
      <aside
        className={`relative flex h-full flex-col border-r border-border bg-surface shadow-[10px_0_32px_rgba(14,15,12,0.06)] transition-all duration-300 ${collapsed ? 'w-[86px]' : 'w-[280px]'}`}
        aria-label="Sidebar navigasi"
      >
        <div className={`flex h-[88px] items-center border-b border-border bg-surface transition-all duration-300 ease-out ${collapsed ? 'justify-center px-3' : 'gap-3 px-5'}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-bg"
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            <Menu size={22} strokeWidth={2.4} />
          </button>

          <div
            className={`flex min-w-0 items-center gap-3 overflow-hidden transition-all duration-300 ease-out ${
              collapsed ? 'max-w-0 -translate-x-2 opacity-0' : 'max-w-[190px] translate-x-0 opacity-100'
            }`}
            aria-hidden={collapsed}
          >
            <CashFlowKuLogo size={44} rounded={22} className="shrink-0 shadow-sm" />
            <div className="min-w-0">
              <p className="truncate text-xl font-black leading-none text-text">CashFlowKu</p>
              <p className="mt-1 truncate text-xs font-medium text-muted">Keuangan pribadi</p>
            </div>
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'space-y-2 px-2 py-4' : 'space-y-1 px-3 py-5'}`} aria-label="Menu utama">
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
                collapsed
                  ? `group flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center transition-colors ${
                      isActive ? 'bg-primary-pale text-text' : 'text-text-2 hover:bg-bg hover:text-text'
                    }`
                  : `group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                      isActive ? 'bg-primary-pale text-text' : 'text-text-2 hover:bg-bg hover:text-text'
                    }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={collapsed ? 21 : 18} strokeWidth={isActive ? 2.6 : 2.2} className="shrink-0" />
                  <span className={collapsed ? 'max-w-full truncate text-[10px] font-bold leading-tight' : 'text-sm font-bold'}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          {!collapsed ? (
            <div className="rounded-[24px] border border-border bg-bg p-4 shadow-sm">
              <p className="text-sm font-black text-text">Panduan Penggunaan</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">Pelajari alur transaksi, tagihan, dan laporan dengan cepat.</p>
              <button onClick={() => setShowPanduan(true)} className="btn-primary mt-4 w-full justify-center">
                Lihat Panduan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPanduan(true)}
              className="flex h-[68px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-bg px-1 text-text shadow-sm transition-colors hover:bg-primary-pale"
              title="Lihat panduan"
              aria-label="Lihat panduan"
            >
              <Sparkles size={20} />
              <span className="text-[10px] font-bold leading-tight">Panduan</span>
            </button>
          )}
        </div>
      </aside>

      {showPanduan && <PanduanModal onClose={() => setShowPanduan(false)} />}
    </>
  )
}
