import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationMenu from './NotificationMenu'
import ProfileModal from './ProfileModal'

const AVATAR_OPTIONS = [
  { id: 'cat',     emoji: '🐱', bg: '#8B5CF6' },
  { id: 'dog',     emoji: '🐶', bg: '#F59E0B' },
  { id: 'fox',     emoji: '🦊', bg: '#EF4444' },
  { id: 'bear',    emoji: '🐻', bg: '#92400E' },
  { id: 'panda',   emoji: '🐼', bg: '#1F2937' },
  { id: 'koala',   emoji: '🐨', bg: '#6B7280' },
  { id: 'lion',    emoji: '🦁', bg: '#D97706' },
  { id: 'tiger',   emoji: '🐯', bg: '#EA580C' },
  { id: 'bunny',   emoji: '🐰', bg: '#EC4899' },
  { id: 'frog',    emoji: '🐸', bg: '#16A34A' },
  { id: 'monkey',  emoji: '🐵', bg: '#B45309' },
  { id: 'penguin', emoji: '🐧', bg: '#0284C7' },
  { id: 'owl',     emoji: '🦉', bg: '#7C3AED' },
  { id: 'dino',    emoji: '🦕', bg: '#059669' },
  { id: 'dragon',  emoji: '🐲', bg: '#DC2626' },
  { id: 'unicorn', emoji: '🦄', bg: '#DB2777' },
  { id: 'robot',   emoji: '🤖', bg: '#4F46E5' },
  { id: 'alien',   emoji: '👾', bg: '#7C3AED' },
  { id: 'ninja',   emoji: '🥷', bg: '#111827' },
  { id: 'cowboy',  emoji: '🤠', bg: '#92400E' },
]

const GREET_MAP = { morning: 'Selamat pagi', afternoon: 'Selamat siang', evening: 'Selamat sore', night: 'Selamat malam' }

function getTimeSlot() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 15) return 'afternoon'
  if (h < 19) return 'evening'
  return 'night'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isDark, setIsDark]           = useState(false)
  const [dropOpen, setDropOpen]       = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') { document.documentElement.classList.add('dark'); setIsDark(true) }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.add('disable-transitions')
    if (isDark) { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); setIsDark(false) }
    else { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); setIsDark(true) }
    window.getComputedStyle(document.documentElement).opacity
    document.documentElement.classList.remove('disable-transitions')
  }

  const displayName  = user?.user_metadata?.full_name
                    || user?.user_metadata?.name
                    || user?.email?.split('@')[0]
                    || 'Pengguna'
  const firstName    = displayName.split(' ')[0]
  const avatarId     = user?.user_metadata?.avatar || null
  const avatarObj    = AVATAR_OPTIONS.find(a => a.id === avatarId)
  const initials     = displayName.slice(0, 2).toUpperCase()
  const INIT_COLORS  = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']
  const initColor    = INIT_COLORS[initials.charCodeAt(0) % INIT_COLORS.length]
  const avatarBg     = avatarObj ? avatarObj.bg : initColor
  const avatarContent = avatarObj ? (
    <span className="text-base leading-none">{avatarObj.emoji}</span>
  ) : (
    <span className="text-white font-black text-sm">{initials}</span>
  )

  const greeting = GREET_MAP[getTimeSlot()]

  return (
    <>
      <header className="bg-surface/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <nav className="flex items-center justify-between px-4 lg:px-8 h-14" aria-label="Navigasi Utama">

          {/* Kiri: Sapaan mobile */}
          <div className="lg:hidden flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-muted leading-none mb-0.5">{greeting},</p>
            <p className="text-sm font-black text-text truncate max-w-[160px] leading-none">{firstName} 👋</p>
          </div>

          {/* Kanan: Actions */}
          <div className="flex items-center gap-1 lg:gap-2 ml-auto">

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-text hover:bg-bg border border-transparent hover:border-border transition-all"
              aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            >
              {isDark
                ? <Sun size={17} strokeWidth={2} />
                : <Moon size={17} strokeWidth={2} />}
            </button>

            {/* Notifikasi */}
            <NotificationMenu />

            {/* ── PROFIL ── */}
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(p => !p)}
                aria-expanded={dropOpen}
                aria-haspopup="true"
                aria-label="Menu Akun"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl hover:bg-bg border border-transparent hover:border-border transition-all"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-offset-1 ring-offset-surface"
                  style={{ backgroundColor: avatarBg, ringColor: avatarBg + '40' }}
                  aria-hidden="true"
                >
                  {avatarContent}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-text leading-tight max-w-[120px] truncate">{displayName}</p>
                  <p className="text-[10px] font-semibold text-muted">Pro Member</p>
                </div>
                <ChevronDown
                  size={13}
                  className={`hidden lg:block text-muted transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden animate-fade-up origin-top-right">

                  {/* User Header */}
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {avatarContent}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text truncate">{displayName}</p>
                      <p className="text-[10px] text-muted font-medium truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => { setShowProfile(true); setDropOpen(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-text-2 hover:bg-bg hover:text-text rounded-xl transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-bg flex items-center justify-center">
                        <Settings size={13} className="text-muted" />
                      </div>
                      Pengaturan Akun
                    </button>

                    <div className="h-px bg-border mx-1 my-1" />

                    <button
                      onClick={() => { setDropOpen(false); logout() }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-expense hover:bg-expense-light rounded-xl transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-expense-light flex items-center justify-center">
                        <LogOut size={13} className="text-expense" />
                      </div>
                      Keluar
                    </button>
                  </div>

                  <div className="h-1.5" />
                </div>
              )}
            </div>

          </div>
        </nav>
      </header>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
