import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// WAKTU AUTO LOGOUT: 15 Menit = 900000 ms
const AUTO_LOGOUT_TIME = 900000; 

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  
  // State untuk fitur Lupa Password
  const [recoveryMode, setRecoveryMode] = useState(false) 

  // 1. Mengelola Sesi Supabase (Bawaan)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      
      // Deteksi jika user mengklik link Lupa Password dari email
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  // 2. Sistem Auto Logout karena Inactivity (Idle)
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (user) {
          console.log("Sesi berakhir karena tidak ada aktivitas.");
          await supabase.auth.signOut(); // Paksa logout di background
          
          // PERBAIKAN 404: Jangan pakai reload(), tapi paksa arahkan ke halaman utama (Login)
          window.location.href = '/'; 
        }
      }, AUTO_LOGOUT_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    if (user) {
      resetTimer(); 
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]); 

  // --- FUNGSI AUTENTIKASI ---

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) window.location.href = '/' 
    return error
  }

  const register = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, password, options: { data: { full_name: name } }
    })
    if (error) return error;
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return { message: 'User already registered' };
    }
    return null;
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' 
  }

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    return error
  }

  // --- FUNGSI LUPA PASSWORD ---
  
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, 
    })
    return error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return error
  }

  const updateProfile = async ({ name, avatar }) => {
    const currentMeta = user?.user_metadata || {}
    const updates = { ...currentMeta }
    if (name   !== undefined) updates.full_name = name
    if (avatar !== undefined) updates.avatar    = avatar

    const { error } = await supabase.auth.updateUser({ data: updates })
    if (error) return error

    // refreshSession() memaksa Supabase menerbitkan JWT baru dengan metadata terbaru
    // Ini penting untuk user Google OAuth yang punya field `name` dari Google
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession()
    if (!refreshErr && refreshed?.user) setUser(refreshed.user)

    return null
  }

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, loginWithGoogle,
      resetPassword, updatePassword, updateProfile, recoveryMode, setRecoveryMode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)