import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// WAKTU AUTO LOGOUT (Dalam Milidetik)
// 15 Menit = 15 * 60 * 1000 = 900000 ms
const AUTO_LOGOUT_TIME = 900000; 

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Mengelola Sesi Supabase (Bawaan)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  // 2. TAMBAHAN: Sistem Auto Logout karena Inactivity (Idle)
  useEffect(() => {
    let timeoutId;

    // Fungsi untuk mereset timer setiap kali ada pergerakan
    const resetTimer = () => {
      clearTimeout(timeoutId);
      
      // Pasang ulang timer
      timeoutId = setTimeout(async () => {
        if (user) {
          console.log("Sesi berakhir karena tidak ada aktivitas.");
          await supabase.auth.signOut(); // Paksa logout
          window.location.reload(); // Refresh halaman agar kembali ke AuthPage
        }
      }, AUTO_LOGOUT_TIME);
    };

    // Daftar aktivitas yang dianggap "aktif"
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Jika user sedang login, pasang pendeteksi pergerakan
    if (user) {
      resetTimer(); // Mulai hitung mundur pertama kali
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    // Bersihkan pelacak jika komponen dibongkar atau user logout
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]); // Efek ini bergantung pada state 'user'

const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    // TAMBAHAN: Jika tidak ada error (login berhasil), paksa pindah ke Dashboard
    if (!error) {
      window.location.href = '/' 
    }
    
    return error
  }

// Tambahkan parameter 'name'
  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name
        }
      }
    })

    // 1. Jika ada error bawaan dari Supabase (misal: password terlalu lemah)
    if (error) return error;

    // 2. TRIK PRO: Deteksi "Sukses Palsu" untuk email yang sudah terdaftar
    // Jika array identities kosong, artinya email sudah ada di database!
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return { message: 'User already registered' };
    }

    // Jika sukses murni
    return null;
  }

const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // Paksa kembali ke root agar bersih
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin 
      }
    })
    return error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)