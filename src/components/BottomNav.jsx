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

// 4 item utama di nav bar
const MAIN_MENU = [
  { path: '/',          icon: <LayoutDashboard size={21} />, label: 'Home' },
  { path: '/transaksi', icon: <ArrowRightLeft size={21} />,  label: 'Transaksi' },
  { path: '/laporan',   icon: <BarChart3 size={21} />,       label: 'Laporan' },
  { path: '/insights',  icon: <Sparkles size={21} />,        label: 'Insights' },
]

// Item di drawer "Lainnya"
const MORE_MENU = [
  { path: '/investasi', icon: <TrendingUp size={20} />,  label: 'Investasi',     desc: 'Portofolio & aset' },
  { path: '/hutang',    icon: <CreditCard size={20} />,  label: 'Hutang',        desc: 'Tagihan & cicilan' },
  { path: '/target',    icon: <Target size={20} />,      label: 'Target Cerdas', desc: 'Tujuan finansial' },
]

export default function BottomNav() {
  const loc = useLocation()
  const [showMore, setShowMore] = useState(false)

  // Cek apakah halaman aktif ada di MORE_MENU
  const moreActive = MORE_MENU.some(m => loc.pathname.startsWith(m.path))

  return (
    <>
      {/* Backdrop */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* Drawer "Lainnya" */}
      {showMore && (
        <div className="fixed bottom-16 left-2 right-2 z-50 lg:hidden bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <p className="text-xs font-black text-muted uppercase tracking-widest">Menu Lainnya</p>
            <button onClick={() => setShowMore(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-bg text-muted hover:text-text transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-border border-t border-border">
            {MORE_MENU.map(m => {
              const isActive = loc.pathname.startsWith(m.path)
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center justify-center gap-1.5 py-5 transition-colors ${
                    isActive ? 'bg-primary/10' : 'hover:bg-bg'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-primary text-white' : 'bg-bg text-muted'}`}>
                    {m.icon}
                  </div>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-primary' : 'text-text-2'}`}>{m.label}</span>
                  <span className="text-[9px] text-muted text-center px-2 leading-tight">{m.desc}</span>
                </Link>
              )
            })}
          </div>
          <div className="h-2" />
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 transition-colors"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">

          {/* 4 main items */}
          {MAIN_MENU.map(m => {
            const isActive = m.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(m.path)
            return (
              <Link
                key={m.path}
                to={m.path}
                className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
              >
                <div className={`transition-all duration-200 p-1.5 rounded-xl ${
                  isActive ? 'bg-primary text-white scale-105 shadow-sm' : 'text-muted'
                }`}>
                  {m.icon}
                </div>
                <span className={`text-[9px] font-bold tracking-wide leading-none ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}>
                  {m.label}
                </span>
              </Link>
            )
          })}

          {/* Tombol Lainnya */}
          <button
            onClick={() => setShowMore(p => !p)}
            className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
          >
            <div className={`transition-all duration-200 p-1.5 rounded-xl ${
              moreActive || showMore ? 'bg-primary text-white scale-105 shadow-sm' : 'text-muted'
            }`}>
              <MoreHorizontal size={21} />
            </div>
            <span className={`text-[9px] font-bold tracking-wide leading-none ${
              moreActive || showMore ? 'text-primary' : 'text-muted'
            }`}>
              Lainnya
            </span>
          </button>

        </div>
      </div>
    </>
  )
}
