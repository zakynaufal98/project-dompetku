import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowRightLeft,
  BarChart3,
  Sparkles,
  TrendingUp,
  CreditCard,
  Target,
  MoreHorizontal,
  X
} from 'lucide-react'

const MAIN_MENU = [
  { path: '/',          icon: LayoutDashboard, label: 'Home',      color: '#6366f1' },
  { path: '/transaksi', icon: ArrowRightLeft,  label: 'Transaksi', color: '#14B8A6' },
  { path: '/laporan',   icon: BarChart3,       label: 'Laporan',   color: '#A855F7' },
  { path: '/insights',  icon: Sparkles,        label: 'Insights',  color: '#EC4899' },
]

const MORE_MENU = [
  { path: '/investasi', icon: TrendingUp, label: 'Investasi',     desc: 'Portofolio & aset',  color: '#F59E0B' },
  { path: '/hutang',    icon: CreditCard, label: 'Hutang',        desc: 'Tagihan & cicilan',  color: '#f43f5e' },
  { path: '/target',    icon: Target,     label: 'Target Cerdas', desc: 'Tujuan finansial',   color: '#10B981' },
]

export default function BottomNav() {
  const loc = useLocation()
  const [showMore, setShowMore] = useState(false)

  const moreActive = MORE_MENU.some(m => loc.pathname.startsWith(m.path))

  return (
    <>
      {/* Backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer "Lainnya" */}
      {showMore && (
        <div
          className="fixed bottom-[68px] left-3 right-3 z-50 lg:hidden bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden animate-fade-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-menu-title"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p id="more-menu-title" className="text-[10px] font-black text-muted uppercase tracking-widest">
              Menu Lainnya
            </p>
            <button
              onClick={() => setShowMore(false)}
              aria-label="Tutup menu lainnya"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg text-muted hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-0 divide-x divide-border border-t border-border">
            {MORE_MENU.map(m => {
              const Icon = m.icon
              const isActive = loc.pathname.startsWith(m.path)
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  onClick={() => setShowMore(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-2 py-5 transition-colors ${
                    isActive ? '' : 'hover:bg-bg'
                  }`}
                  style={isActive ? { backgroundColor: m.color + '10' } : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: isActive ? m.color : undefined,
                      background: isActive ? undefined : 'var(--color-bg)',
                    }}
                  >
                    <Icon size={19} style={{ color: isActive ? '#fff' : m.color }} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold" style={{ color: isActive ? m.color : undefined }}>{m.label}</p>
                    <p className="text-[9px] text-muted leading-tight mt-0.5">{m.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="h-3" />
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border z-50 transition-colors"
        aria-label="Navigasi bawah"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">

          {MAIN_MENU.map(m => {
            const Icon = m.icon
            const isActive = m.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(m.path)
            return (
              <Link
                key={m.path}
                to={m.path}
                aria-label={m.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
              >
                <div
                  className="transition-all duration-200 p-1.5 rounded-xl"
                  style={isActive
                    ? { backgroundColor: m.color + '18', color: m.color }
                    : { color: 'var(--color-muted)' }
                  }
                >
                  <Icon size={20} />
                </div>
                <span
                  className="text-[9px] font-bold tracking-wide leading-none"
                  style={{ color: isActive ? m.color : 'var(--color-muted)' }}
                >
                  {m.label}
                </span>
              </Link>
            )
          })}

          {/* Tombol Lainnya */}
          <button
            onClick={() => setShowMore(p => !p)}
            aria-label={showMore ? 'Tutup menu lainnya' : 'Buka menu lainnya'}
            aria-expanded={showMore}
            aria-haspopup="dialog"
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
          >
            <div
              className="transition-all duration-200 p-1.5 rounded-xl"
              style={moreActive || showMore
                ? { backgroundColor: '#6366f118', color: '#6366f1' }
                : { color: 'var(--color-muted)' }
              }
            >
              <MoreHorizontal size={20} />
            </div>
            <span
              className="text-[9px] font-bold tracking-wide leading-none"
              style={{ color: moreActive || showMore ? '#6366f1' : 'var(--color-muted)' }}
            >
              Lainnya
            </span>
          </button>

        </div>
      </nav>
    </>
  )
}
