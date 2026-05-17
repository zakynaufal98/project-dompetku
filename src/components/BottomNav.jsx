import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  Plus,
} from 'lucide-react'

const WEB_MAIN_MENU = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/transaksi', icon: ArrowRightLeft, label: 'Transaksi' },
  { path: '/laporan', icon: BarChart3, label: 'Laporan' },
  { path: '/insights', icon: Sparkles, label: 'Insights' },
]

const BASE_MORE_MENU = [
  { path: '/investasi', icon: TrendingUp, label: 'Investasi', desc: 'Portofolio aset' },
  { path: '/hutang', icon: CreditCard, label: 'Hutang', desc: 'Tagihan dan cicilan' },
  { path: '/target', icon: Target, label: 'Target', desc: 'Tujuan finansial' },
]

export default function BottomNav({ platform = 'web' }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)
  const isAndroidApp = platform === 'android'
  const moreMenu = isAndroidApp
    ? [{ path: '/insights', icon: Sparkles, label: 'Insights', desc: 'Kesehatan finansial' }, ...BASE_MORE_MENU]
    : BASE_MORE_MENU
  const mainMenu = isAndroidApp
    ? [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/transaksi', icon: ArrowRightLeft, label: 'Transaksi' },
        { path: '/laporan', icon: BarChart3, label: 'Laporan' },
      ]
    : WEB_MAIN_MENU

  const moreActive = moreMenu.some((m) => loc.pathname.startsWith(m.path))

  const renderNavLink = (m) => {
    const Icon = m.icon
    const isActive = m.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(m.path)
    return (
      <Link
        key={m.path}
        to={m.path}
        aria-current={isActive ? 'page' : undefined}
        className="flex flex-1 flex-col items-center justify-center gap-1"
      >
        <div className={`flex items-center justify-center rounded-full transition-colors ${
          isAndroidApp ? 'h-11 w-11' : 'h-10 w-10'
        } ${isActive ? 'bg-primary text-text shadow-sm' : 'text-muted'}`}>
          <Icon size={18} />
        </div>
        <span className={`font-bold ${isAndroidApp ? 'text-[11px]' : 'text-[10px]'} ${isActive ? 'text-text' : 'text-muted'}`}>{m.label}</span>
      </Link>
    )
  }

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm lg:hidden" onClick={() => setShowMore(false)} aria-hidden="true" />
      )}

      {showMore && (
        <div
          className={`fixed left-3 right-3 z-50 overflow-hidden border border-border bg-bg shadow-2xl lg:hidden ${
            isAndroidApp ? 'rounded-[24px]' : 'rounded-[28px]'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-menu-title"
          style={{ bottom: isAndroidApp ? 'calc(92px + env(safe-area-inset-bottom))' : 'calc(78px + env(safe-area-inset-bottom))' }}
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
            {moreMenu.map((m) => {
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
        className={`fixed z-50 backdrop-blur-xl lg:hidden ${
          isAndroidApp
            ? 'bottom-3 left-3 right-3 rounded-[28px] border border-border bg-surface/96 shadow-[0_18px_40px_rgba(14,15,12,0.16)]'
            : 'bottom-0 left-0 right-0 border-t border-border bg-bg/95'
        }`}
        aria-label="Navigasi bawah"
        style={{ paddingBottom: isAndroidApp ? 'max(10px, env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}
      >
        {isAndroidApp ? (
          <div className="relative mx-auto flex h-[80px] max-w-[640px] items-end px-2 pb-1.5 pt-2">
            <div className="flex flex-1 items-stretch">
              {mainMenu.slice(0, 2).map(renderNavLink)}
            </div>

            <div className="w-[86px] shrink-0" aria-hidden="true" />

            <div className="flex flex-1 items-stretch">
              {mainMenu.slice(2).map(renderNavLink)}
              <button
                onClick={() => setShowMore((prev) => !prev)}
                aria-label={showMore ? 'Tutup menu lainnya' : 'Buka menu lainnya'}
                aria-expanded={showMore}
                aria-haspopup="dialog"
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${(showMore || moreActive) ? 'bg-primary text-text shadow-sm' : 'text-muted'}`}>
                  <MoreHorizontal size={18} />
                </div>
                <span className={`text-[11px] font-bold ${(showMore || moreActive) ? 'text-text' : 'text-muted'}`}>Lainnya</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/transaksi?compose=1')}
              aria-label="Tambah transaksi"
              className="absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-4 items-center justify-center rounded-[24px] border-4 border-bg bg-primary text-text shadow-[0_18px_32px_rgba(176,236,96,0.32)] transition-transform hover:scale-[1.02]"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="mx-auto flex h-[76px] max-w-[640px] items-stretch">
            {mainMenu.map(renderNavLink)}

            <button
              onClick={() => setShowMore((prev) => !prev)}
              aria-label={showMore ? 'Tutup menu lainnya' : 'Buka menu lainnya'}
              aria-expanded={showMore}
              aria-haspopup="dialog"
              className="flex flex-1 flex-col items-center justify-center gap-1"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${(showMore || moreActive) ? 'bg-primary text-text shadow-sm' : 'text-muted'}`}>
                <MoreHorizontal size={18} />
              </div>
              <span className={`text-[10px] font-bold ${(showMore || moreActive) ? 'text-text' : 'text-muted'}`}>Lainnya</span>
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
