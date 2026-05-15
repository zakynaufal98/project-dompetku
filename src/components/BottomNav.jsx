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
  X,
} from 'lucide-react'

const MAIN_MENU = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/transaksi', icon: ArrowRightLeft, label: 'Transaksi' },
  { path: '/laporan', icon: BarChart3, label: 'Laporan' },
  { path: '/insights', icon: Sparkles, label: 'Insights' },
]

const MORE_MENU = [
  { path: '/investasi', icon: TrendingUp, label: 'Investasi', desc: 'Portofolio aset' },
  { path: '/hutang', icon: CreditCard, label: 'Hutang', desc: 'Tagihan dan cicilan' },
  { path: '/target', icon: Target, label: 'Target', desc: 'Tujuan finansial' },
]

export default function BottomNav() {
  const loc = useLocation()
  const [showMore, setShowMore] = useState(false)

  const moreActive = MORE_MENU.some((m) => loc.pathname.startsWith(m.path))

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm lg:hidden" onClick={() => setShowMore(false)} aria-hidden="true" />
      )}

      {showMore && (
        <div
          className="fixed left-3 right-3 z-50 overflow-hidden rounded-[28px] border border-border bg-bg shadow-2xl lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-menu-title"
          style={{ bottom: 'calc(78px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p id="more-menu-title" className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
              Menu Lainnya
            </p>
            <button
              onClick={() => setShowMore(false)}
              aria-label="Tutup menu lainnya"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-text"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border">
            {MORE_MENU.map((m) => {
              const Icon = m.icon
              const isActive = loc.pathname.startsWith(m.path)
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${isActive ? 'bg-primary-pale' : 'hover:bg-surface'}`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface">
                    <Icon size={18} className="text-text" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-text">{m.label}</p>
                    <p className="text-xs text-muted">{m.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
          <div style={{ height: 'max(12px, env(safe-area-inset-bottom))' }} />
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg/95 backdrop-blur-xl lg:hidden"
        aria-label="Navigasi bawah"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex h-[76px] max-w-[640px] items-stretch">
          {MAIN_MENU.map((m) => {
            const Icon = m.icon
            const isActive = m.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(m.path)
            return (
              <Link
                key={m.path}
                to={m.path}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? 'bg-primary text-text' : 'text-muted'}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-text' : 'text-muted'}`}>{m.label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setShowMore((prev) => !prev)}
            aria-label={showMore ? 'Tutup menu lainnya' : 'Buka menu lainnya'}
            aria-expanded={showMore}
            aria-haspopup="dialog"
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${(showMore || moreActive) ? 'bg-primary text-text' : 'text-muted'}`}>
              <MoreHorizontal size={18} />
            </div>
            <span className={`text-[10px] font-bold ${(showMore || moreActive) ? 'text-text' : 'text-muted'}`}>Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  )
}
