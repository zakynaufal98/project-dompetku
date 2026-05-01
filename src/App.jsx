import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Spinner } from './components/UI'

// Layout components dimuat eager (kecil, selalu dibutuhkan)
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Navbar from './components/Navbar'
import RecoveryModal from './components/RecoveryModal'

// 🚀 PERFORMANCE: Lazy load semua halaman → code splitting otomatis
// Setiap halaman akan dimuat hanya saat pertama kali dikunjungi
const AuthPage      = lazy(() => import('./pages/AuthPage'))
const LandingPage   = lazy(() => import('./pages/LandingPage'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Transaksi     = lazy(() => import('./pages/Transaksi'))
const Investasi     = lazy(() => import('./pages/Investasi'))
const Laporan       = lazy(() => import('./pages/Laporan'))
const Hutang        = lazy(() => import('./pages/Hutang'))
const TargetCerdas  = lazy(() => import('./pages/TargetCerdas'))
const Insights      = lazy(() => import('./pages/Insights'))

// Fallback loading saat lazy page sedang dimuat
const PageLoader = () => (
  <div className="flex items-center justify-center h-64 w-full">
    <Spinner size="lg" />
  </div>
)

function AppLayout() {
  const { user, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo(0, 0)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center" role="status" aria-label="Memuat aplikasi">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-muted font-medium text-sm">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/login"   element={<AuthPage defaultMode="login" />} />
          <Route path="/register" element={<AuthPage defaultMode="register" />} />
          <Route path="*"        element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <DataProvider>
      {/* ACCESSIBILITY: wrapper div tetap dipakai agar layout flex terjaga */}
      <div className="flex h-[100dvh] overflow-hidden transition-colors duration-300">

        {/* Sidebar - hanya di desktop */}
        <div className="hidden lg:block" aria-hidden="true">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        {/* ACCESSIBILITY: <main> landmark agar screen reader bisa lompat ke konten */}
        <main
          ref={mainRef}
          id="main-content"
          aria-label="Konten utama"
          className="flex-1 h-full overflow-y-auto w-full relative pb-24 lg:pb-0 scroll-smooth"
        >
          <Navbar />

          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/transaksi"     element={<Transaksi />} />
                <Route path="/investasi"     element={<Investasi />} />
                <Route path="/laporan"       element={<Navigate to="/laporan/bulanan" replace />} />
                <Route path="/laporan/:tab"  element={<Laporan />} />
                <Route path="/bulanan"       element={<Navigate to="/laporan/bulanan" replace />} />
                <Route path="/tahunan"       element={<Navigate to="/laporan/tahunan" replace />} />
                <Route path="/grafik"        element={<Navigate to="/laporan/grafik" replace />} />
                <Route path="/hutang"        element={<Hutang />} />
                <Route path="/target"        element={<TargetCerdas />} />
                <Route path="/insights"      element={<Insights />} />
                <Route path="*"             element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        {/* Bottom nav mobile - aria-label untuk screen reader */}
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

