import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://psgrlzdscsgtszbbhusb.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZ3JsemRzY3NndHN6YmJodXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg4MTUsImV4cCI6MjA5MjQ3NDgxNX0.RcXRpf2kTdcz8m0gaU20jVM1bydTym71EeqtWgfzp1A'

const REMEMBER_KEY = 'cashflowku_remember'

// Routing storage: sessionStorage HANYA jika user EKSPLISIT memilih "Jangan Ingat Saya".
// Default (belum pernah set / pertama kali login) selalu pakai localStorage agar sesi tidak hilang saat browser ditutup.
const authStorage = {
  getItem:    (key) => localStorage.getItem(REMEMBER_KEY) === 'false'
                         ? sessionStorage.getItem(key)
                         : localStorage.getItem(key),
  setItem:    (key, value) => {
    if (localStorage.getItem(REMEMBER_KEY) === 'false') {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key) // Bersihkan sisi lain agar tidak konflik
    }
  },
  removeItem: (key) => { localStorage.removeItem(key); sessionStorage.removeItem(key) },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: authStorage, persistSession: true, autoRefreshToken: true },
})
