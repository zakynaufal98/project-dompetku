import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav' // <-- Import komponen baru
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Transaksi from './pages/Transaksi'
import Investasi from './pages/Investasi'
import Bulanan from './pages/Bulanan'
import Tahunan from './pages/Tahunan'
import Grafik from './pages/Grafik'
import { Spinner } from './components/UI'

function AppLayout() {
  const { user, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

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
      <div className="flex h-[100dvh] bg-slate-50 overflow-hidden text-slate-800">
        
        {/* SIDEBAR - Sekarang hanya merender di Desktop (lg:block) */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
        
        {/* KONTEN UTAMA */}
        {/* Tambahkan pb-24 agar konten bawah tidak tertutup menu mobile */}
        <main className="flex-1 h-full overflow-y-auto w-full relative pb-24 lg:pb-0">
          
          {/* HEADER MOBILE YANG BERSIH */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#E8353A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              D
            </div>
            <span className="tabular-nums  font-black text-lg text-slate-800 tracking-tight">DompetKu</span>
          </div>

          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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

        {/* BOTTOM NAV - Hanya muncul di Mobile */}
        <BottomNav />
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