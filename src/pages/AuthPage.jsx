import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BarChart3, PieChart, ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react'


const FEATURES = [
  { icon: <BarChart3 size={22} />, title: 'Pantau keuangan', sub: 'dengan mudah' },
  { icon: <PieChart size={22} />, title: 'Kelola pemasukan', sub: 'dan pengeluaran' },
  { icon: <ShieldCheck size={22} />, title: 'Aman, cepat,', sub: 'dan terpercaya' },
]

export default function AuthPage() {
  // 1. TAMBAHAN: Ambil loginWithGoogle dari useAuth
  const { login, register, loginWithGoogle, resetPassword } = useAuth()
  
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const switchMode = (m) => { 
    setMode(m); 
    setMsg(null); 
    setEmail(''); 
    setPass(''); 
    setName('') 
  }

  // Handler untuk Login / Register biasa (Email & Password)
  // Handler untuk Login / Register biasa (Email & Password)
  const handle = async () => {
    // 1. Validasi Umum
    if (mode === 'register' && !name.trim()) { 
      setMsg({ text: 'Nama lengkap wajib diisi', ok: false }); 
      return 
    }
    if (!email.trim()) { 
      setMsg({ text: 'Email wajib diisi', ok: false }); 
      return 
    }
    if (!pass) { 
      setMsg({ text: 'Password wajib diisi', ok: false }); 
      return 
    }

    // 2. Validasi Password Kuat (HANYA UNTUK REGISTER)
    if (mode === 'register') {
      // Minimal 8 karakter (standar keamanan modern)
      if (pass.length < 8) { 
        setMsg({ text: 'Password minimal 8 karakter', ok: false }); 
        return 
      }
      // Harus ada huruf kapital
      if (!/[A-Z]/.test(pass)) { 
        setMsg({ text: 'Password harus mengandung huruf kapital (A-Z)', ok: false }); 
        return 
      }
      // Harus ada angka
      if (!/[0-9]/.test(pass)) { 
        setMsg({ text: 'Password harus mengandung angka (0-9)', ok: false }); 
        return 
      }
      // Harus ada karakter spesial/simbol
      if (!/[!@#$%^&*(),.?":{}|<>_]/.test(pass)) { 
        setMsg({ text: 'Password harus mengandung karakter spesial (contoh: @, #, !)', ok: false }); 
        return 
      }
    } else {
      // Validasi ringan untuk mode Login
      if (pass.length < 6) { 
        setMsg({ text: 'Password minimal 6 karakter', ok: false }); 
        return 
      }
    }
    
    // 3. Proses Pengiriman Data
    setBusy(true); 
    setMsg(null)
    
    const err = mode === 'login' 
      ? await login(email, pass) 
      : await register(email, pass, name)
      
    setBusy(false)
    
    // MENCEGAT DAN MENERJEMAHKAN ERROR SUPABASE
    if (err) {
      let pesanError = err.message;
      
      // Jika errornya karena email sudah ada
      if (pesanError.toLowerCase().includes('already registered')) {
        pesanError = 'Email ini sudah terdaftar. Silakan beralih ke menu Masuk.';
      } 
      // Jika errornya karena salah password saat login
      else if (pesanError.toLowerCase().includes('invalid login credentials')) {
        pesanError = 'Email atau password yang kamu masukkan salah.';
      }
      
      setMsg({ text: pesanError, ok: false });
    } 
    else if (mode === 'register') {
      setMsg({ text: '✅ Akun berhasil dibuat! Cek email kamu untuk konfirmasi.', ok: true })
      // Opsional: Kosongkan form setelah sukses mendaftar
      setEmail('');
      setPass('');
      setName('');
    }
  }

  // 2. TAMBAHAN: Handler khusus untuk tombol Google
  const handleGoogleLogin = async () => {
    setBusy(true);
    setMsg(null);
    const err = await loginWithGoogle();
    
    // Jika ada error (misal user membatalkan popup), tampilkan error
    if (err) {
      setMsg({ text: err.message, ok: false });
      setBusy(false);
    }
    // Jika sukses, Supabase akan otomatis me-redirect halaman, jadi loading akan terus berjalan
  }

  // 3. TAMBAHAN: Handler untuk Lupa Password
  const handleLupaPassword = async () => {
    // Pastikan user sudah mengetik emailnya
    if (!email.trim()) {
      setMsg({ text: 'Silakan ketik email kamu terlebih dahulu di kolom atas.', ok: false });
      return;
    }
    
    setBusy(true);
    setMsg(null);
    
    const err = await resetPassword(email);
    setBusy(false);
    
    if (err) {
      setMsg({ text: err.message, ok: false });
    } else {
      setMsg({ text: '✅ Link reset password telah dikirim ke email kamu!', ok: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 lg:p-0">
      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row bg-surface rounded-3xl shadow-card overflow-hidden border border-border">
        
        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div className="relative lg:w-1/2 p-10 lg:p-14 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-[#FBF1F1] -z-10" />
          
          <div className="absolute top-12 left-12 grid grid-cols-5 gap-2.5 opacity-40">
            {Array(15).fill(0).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
            ))}
          </div>

          <div className="mb-14 lg:mb-0 relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="w-20 h-20 bg-surface rounded-3xl shadow-card border border-border flex items-center justify-center mb-6">
              <span className="text-primary font-bold text-4xl leading-none">D</span>
            </div>
            <h1 className="font-bold text-primary text-4xl lg:text-5xl tracking-tight mb-2">
              DompetKu Pro
            </h1>
            <p className="text-text-2 text-lg">Kelola keuangan lebih cerdas</p>
          </div>

          <div className="space-y-6 relative z-10">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary flex-shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div className="flex-1">
                  <p className="text-text font-semibold text-base leading-tight">{f.title}</p>
                  <p className="text-muted text-sm">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-10 lg:p-14 border-t lg:border-t-0 lg:border-l border-border bg-surface">
          <div className="w-full max-w-md">

            <div className="flex justify-center border-b border-border2 mb-10">
              {['login','register'].map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`pb-3.5 px-6 text-sm font-semibold transition-all border-b-2 -mb-px bg-transparent cursor-pointer ${
                    mode === m
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text-2'
                  }`}>
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>

            <h2 className="font-semibold text-2xl text-center text-text mb-10">
              {mode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
            </h2>

            <div className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="form-label">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted2" size={18} />
                    <input
                      className="form-input pl-12"
                      type="text"
                      placeholder="Nama kamu"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted2" size={18} />
                  <input
                    className="form-input pl-12"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handle()}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted2" size={18} />
                  <input
                    className="form-input pl-12 pr-12"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handle()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted2 hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 mt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setRemember(!remember)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                    remember ? 'bg-primary border-primary' : 'border-border2 bg-surface'
                  }`}
                >
                  {remember && <span className="text-white text-[11px] font-bold">✓</span>}
                </div>
                <span className="text-sm text-text-2">Ingat saya</span>
              </label>
              {/* Sembunyikan tombol lupa password saat mode Daftar */}
              {mode === 'login' && (
                <button 
                  type="button"
                  onClick={handleLupaPassword}
                  disabled={busy}
                  className="text-sm text-primary font-medium bg-transparent border-none cursor-pointer hover:underline transition-colors disabled:opacity-50"
                >
                  Lupa password?
                </button>
              )}
            </div>

            {msg && (
              <div className={`text-xs mb-6 px-4 py-3 rounded-xl text-center border flex items-center justify-center gap-2.5 ${
                msg.ok
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-expense border-red-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${msg.ok ? 'bg-green-500' : 'bg-expense'}`} />
                {msg.text}
              </div>
            )}

            <button
              onClick={handle}
              disabled={busy}
              className="btn-primary w-full py-3.5 rounded-full text-base mb-8"
            >
              {busy ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                mode === 'login' ? 'Masuk' : 'Daftar'
              )}
            </button>

            <div className="flex items-center gap-5 mb-8">
              <div className="flex-1 h-px bg-border2" />
              <span className="text-xs font-medium text-muted">atau</span>
              <div className="flex-1 h-px bg-border2" />
            </div>

            {/* 3. TAMBAHAN: Pasang handler onClick ke tombol Google */}
            <button 
              onClick={handleGoogleLogin}
              disabled={busy}
              className="btn-secondary w-full py-3.5 rounded-full mb-10 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="animate-spin text-muted" size={20} />
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 18 18" className="flex-shrink-0">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted">
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-primary font-semibold bg-transparent border-none cursor-pointer hover:underline p-0"
              >
                {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}