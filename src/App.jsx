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
import GlobalTransactionComposer from './components/GlobalTransactionComposer'
import { getAppPlatform } from './lib/platform'

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
  const appPlatform = getAppPlatform()
  const isAndroidApp = appPlatform === 'android'

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.documentElement.dataset.appPlatform = appPlatform
    document.body.dataset.appPlatform = appPlatform
    return () => {
      delete document.documentElement.dataset.appPlatform
      delete document.body.dataset.appPlatform
    }
  }, [appPlatform])

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
      <div className={`flex min-h-[100dvh] overflow-hidden transition-colors duration-300 bg-bg ${isAndroidApp ? 'android-shell' : ''}`}>

        <div className="hidden lg:block" aria-hidden="true">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>

        <main
          ref={mainRef}
          id="main-content"
          aria-label="Konten utama"
          className={`flex-1 min-h-[100dvh] overflow-y-auto w-full relative scroll-smooth bg-bg ${
            isAndroidApp
              ? 'pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pb-0'
              : 'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-border/80 lg:block" aria-hidden="true" />
          <Navbar platform={appPlatform} sidebarCollapsed={collapsed} />

          <div className={`max-w-[1320px] mx-auto ${
            isAndroidApp
              ? 'px-3 py-4 md:px-5 md:py-5 lg:px-8 lg:py-8'
              : 'px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8'
          }`}>
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

        <GlobalTransactionComposer />
        <BottomNav platform={appPlatform} />
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
