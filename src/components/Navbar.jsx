import { useAuth } from '../context/AuthContext'
import { LogOut, Wallet } from 'lucide-react'

export default function Navbar() {
  // PERBAIKAN: Gunakan 'logout' agar sesuai dengan AuthContext Anda
  const { user, logout } = useAuth()

  if (!user) return null;

  const userEmail = user?.email || 'Pengguna'
  const initial = userEmail.charAt(0).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 mb-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* LOGO APLIKASI */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800">
            DompetKu<span className="text-emerald-500">Pro</span>
          </span>
        </div>

        {/* PROFIL PENGGUNA & LOGOUT */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full py-1.5 pl-1.5 pr-4 shadow-sm transition-all hover:shadow-md">
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            {initial}
          </div>
          <div className="flex flex-col pr-2 hidden sm:flex">
            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{userEmail}</span>
            <span className="text-[10px] font-semibold text-slate-400">Pro Member</span>
          </div>
          <div className="w-px h-6 bg-slate-100 mx-1 hidden sm:block"></div>
          
          {/* PERBAIKAN: Panggil fungsi logout di onClick */}
          <button 
            onClick={logout} 
            className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-rose-50" 
            title="Keluar"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </nav>
  )
}