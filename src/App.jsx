import { useState, useEffect, useRef } from 'react' // 1. TAMBAHKAN useRef
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav' 
import Navbar from './components/Navbar' 
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Transaksi from './pages/Transaksi'
import Investasi from './pages/Investasi'
import Laporan from './pages/Laporan'
import Hutang from './pages/Hutang'
import TargetCerdas from './pages/TargetCerdas'
import { Spinner } from './components/UI'
import RecoveryModal from './components/RecoveryModal'

function AppLayout() {
  const { user, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  
  // 2. KITA TANGKAP PERUBAHAN URL DI SINI
  const { pathname } = useLocation()
  
  // 3. KITA BUAT REFERENSI UNTUK ELEMEN MAIN
  const mainRef = useRef(null)

  // 4. EFEK UNTUK SCROLL ELEMEN MAIN KE ATAS
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0)
    }
  }, [pathname]) // Akan berjalan setiap kali URL (pathname) berubah

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-muted font-medium text-sm">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <DataProvider>
      <div className="flex h-[100dvh] overflow-hidden transition-colors duration-300">
        
        {/* SIDEBAR */}
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
        
        {/* KONTEN UTAMA */}
        {/* 5. TEMPELKAN mainRef DI SINI AGAR BISA DIKONTROL OLEH useEffect */}
        <main ref={mainRef} className="flex-1 h-full overflow-y-auto w-full relative pb-24 lg:pb-0 scroll-smooth">
          
          <Navbar />

          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/transaksi" element={<Transaksi />} />
              <Route path="/investasi" element={<Investasi />} />
              <Route path="/laporan"   element={<Navigate to="/laporan/bulanan" replace />} />
              <Route path="/laporan/:tab" element={<Laporan />} />
              <Route path="/bulanan"   element={<Navigate to="/laporan/bulanan" replace />} />
              <Route path="/tahunan"   element={<Navigate to="/laporan/tahunan" replace />} />
              <Route path="/grafik"    element={<Navigate to="/laporan/grafik" replace />} />
              <Route path="/hutang"    element={<Hutang />} />
              <Route path="/target"    element={<TargetCerdas />} />
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Routes>
          </div>

        </main>

        {/* BOTTOM NAV */}
        <BottomNav />
      </div>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <RecoveryModal />
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
