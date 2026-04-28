import { useState, useEffect } from 'react'
import { Sun, Moon, Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [isDark, setIsDark] = useState(false)

  // 1. Cek memori browser saat pertama kali render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  // 2. Fungsi untuk menukar tema
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40 transition-colors duration-300">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4">
        
        {/* Bagian Kiri: Sapaan */}
        <div>
          <div className="lg:hidden">
             <p className="text-xs font-bold text-muted2 uppercase tracking-widest mb-0.5">Hai,</p>
             <p className="text-sm font-bold text-text truncate max-w-[150px]">
               {user?.email?.split('@')[0] || 'Pengguna'}
             </p>
          </div>
        </div>

        {/* Bagian Kanan: Menu */}
        <div className="flex items-center gap-2 lg:gap-4">
          
          {/* TOMBOL DARK MODE KITA */}
          <button 
            onClick={toggleTheme} 
            className="p-2 lg:p-2.5 rounded-full text-muted2 hover:text-income hover:bg-income-light transition-all focus:outline-none"
            title={isDark ? 'Beralih ke Terang' : 'Beralih ke Gelap'}
          >
            {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
          </button>

          <button className="p-2 lg:p-2.5 rounded-full text-muted2 hover:text-income hover:bg-income-light transition-all relative">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-expense rounded-full border-2 border-surface"></span>
          </button>

          <button
            onClick={signOut}
            className="lg:hidden p-2 rounded-full text-muted2 hover:text-expense hover:bg-expense-light transition-all"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut size={20} strokeWidth={2.5} />
          </button>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-border2 ml-2">
            <div className="w-9 h-9 rounded-full bg-income-light text-income flex items-center justify-center font-bold">
              <User size={18} strokeWidth={2.5} />
            </div>
            <div className="text-sm">
              <p className="font-bold text-text leading-tight">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-[11px] font-semibold text-muted2">Pro Member</p>
            </div>
            <button onClick={signOut} className="ml-2 p-2 text-muted2 hover:text-expense transition-colors" title="Keluar">
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}
