import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationMenu from './NotificationMenu'
import ProfileModal from './ProfileModal'

const AVATAR_OPTIONS = [
  { id: 'cat', emoji: '🐱', bg: '#163300' },
  { id: 'dog', emoji: '🐶', bg: '#2ead4b' },
  { id: 'fox', emoji: '🦊', bg: '#d03238' },
  { id: 'bear', emoji: '🐻', bg: '#4a3b1c' },
  { id: 'panda', emoji: '🐼', bg: '#0e0f0c' },
  { id: 'koala', emoji: '🐨', bg: '#686b67' },
  { id: 'lion', emoji: '🦁', bg: '#b86700' },
  { id: 'tiger', emoji: '🐯', bg: '#d03238' },
  { id: 'bunny', emoji: '🐰', bg: '#ffc091' },
  { id: 'frog', emoji: '🐸', bg: '#2ead4b' },
  { id: 'monkey', emoji: '🐵', bg: '#8b5a2b' },
  { id: 'penguin', emoji: '🐧', bg: '#38c8ff' },
  { id: 'owl', emoji: '🦉', bg: '#454745' },
  { id: 'dino', emoji: '🦕', bg: '#9fe870' },
  { id: 'dragon', emoji: '🐲', bg: '#163300' },
  { id: 'unicorn', emoji: '🦄', bg: '#ffc091' },
  { id: 'robot', emoji: '🤖', bg: '#0e0f0c' },
  { id: 'alien', emoji: '👾', bg: '#38c8ff' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
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
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
    window.getComputedStyle(document.documentElement).opacity
    document.documentElement.classList.remove('disable-transitions')
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Pengguna'

  const avatarId = user?.user_metadata?.avatar || null
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === avatarId)
  const initials = displayName.slice(0, 2).toUpperCase()
  const initColor = ['#0e0f0c', '#163300', '#2ead4b', '#38c8ff'][initials.charCodeAt(0) % 4]
  const avatarBg = avatarObj ? avatarObj.bg : initColor

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-4 md:px-6 lg:px-8" aria-label="Navigasi Utama">
          <div className="hidden md:block" aria-hidden="true" />

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg text-text transition-colors hover:bg-primary-pale"
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            >
              {isDark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>

            <NotificationMenu />

            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen((prev) => !prev)}
                aria-expanded={dropOpen}
                aria-haspopup="true"
                aria-label="Menu akun"
                className="flex items-center gap-3 rounded-full border border-border bg-surface px-2 py-1.5 transition-colors hover:border-border-2 hover:bg-surface md:px-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white shadow-sm"
                  style={{ backgroundColor: avatarBg }}
                >
                  {avatarObj ? avatarObj.emoji : initials}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="max-w-[140px] truncate text-sm font-black text-text">{displayName}</p>
                  <p className="text-[11px] font-medium text-muted">Kelola profil</p>
                </div>
                <ChevronDown size={14} className={`hidden text-muted transition-transform lg:block ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[24px] border border-border bg-surface shadow-2xl shadow-black/10">
                  <div className="border-b border-border bg-bg px-4 py-4">
                    <p className="truncate text-sm font-black text-text">{displayName}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => { setShowProfile(true); setDropOpen(false) }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-text transition-colors hover:bg-bg"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-pale text-text">
                        <Settings size={15} />
                      </div>
                      Pengaturan Akun
                    </button>

                    <button
                      onClick={() => { setDropOpen(false); logout() }}
                      className="mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-expense transition-colors hover:bg-expense-light"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-expense-light text-expense">
                        <LogOut size={15} />
                      </div>
                      Keluar
                    </button>
                  </div>
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
