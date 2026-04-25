import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Sidebar from './components/Sidebar'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Transaksi from './pages/Transaksi'
import Investasi from './pages/Investasi'
import Bulanan from './pages/Bulanan'
import Tahunan from './pages/Tahunan'
import Grafik from './pages/Grafik'
import { Spinner } from './components/UI'

// Import ikon Menu untuk tampilan Mobile
import { Menu } from 'lucide-react' 

function AppLayout() {
  const { user, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  
  // TAMBAHAN: State untuk mengontrol Sidebar di HP
  const [mobileOpen, setMobileOpen] = useState(false) 

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-slate-500 font-medium text-sm">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <DataProvider>
      {/* 1. PERBAIKAN: Dibungkus dengan flex agar berdampingan Kiri-Kanan */}
      <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
        
        {/* SIDEBAR */}
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen} 
        />
        
        {/* 2. PERBAIKAN: flex-1 agar memenuhi sisa layar, dan overflow-y-auto untuk scroll khusus konten */}
        <main className="flex-1 h-screen overflow-y-auto w-full relative">
          
          {/* HEADER MOBILE (Hanya muncul jika di layar kecil) */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 shadow-sm">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 bg-slate-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8353A] text-white flex items-center justify-center font-bold text-sm">
                D
              </div>
              <span className="font-syne font-black text-lg text-slate-800">DompetKu</span>
            </div>
          </div>

          {/* KONTEN HALAMAN */}
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/transaksi" element={<Transaksi />} />
              <Route path="/investasi" element={<Investasi />} />
              <Route path="/bulanan"   element={<Bulanan />} />
              <Route path="/tahunan"   element={<Tahunan />} />
              <Route path="/grafik"    element={<Grafik />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </div>

        </main>
      </div>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}