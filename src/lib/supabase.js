import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = 'https://psgrlzdscsgtszbbhusb.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzZ3JsemRzY3NndHN6YmJodXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg4MTUsImV4cCI6MjA5MjQ3NDgxNX0.RcXRpf2kTdcz8m0gaU20jVM1bydTym71EeqtWgfzp1A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
