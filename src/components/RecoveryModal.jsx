import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { Field } from '../components/UI' // Kita gunakan komponen Field agar konsisten

export default function RecoveryModal() {
  const { recoveryMode, setRecoveryMode, updatePassword } = useAuth()
  const [newPass, setNewPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)

  if (!recoveryMode) return null

  const handleUpdate = async () => {
    if (newPass.length < 6) {
      setErr('Password minimal 6 karakter'); return
    }
    setBusy(true); setErr('')
    
    const error = await updatePassword(newPass)
    setBusy(false)
    
    if (error) {
      setErr(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setRecoveryMode(false)
        setSuccess(false)
        setNewPass('')
      }, 2000)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-up text-center border border-border">
        
        {success ? (
          <div className="flex flex-col items-center py-6" role="alert">
            <CheckCircle2 size={60} className="text-invest mb-4 animate-bounce" />
            <h3 id="modal-title" className="text-2xl font-bold text-text">Berhasil!</h3>
            <p className="text-muted mt-2 font-medium">Password kamu telah diperbarui.</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-income-light text-income rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors">
              <KeyRound size={28} strokeWidth={2.5} />
            </div>
            
            <h3 id="modal-title" className="text-2xl font-bold text-text mb-2 tracking-tight">
              Buat Password Baru
            </h3>
            <p className="text-muted text-sm font-medium mb-6 leading-relaxed">
              Silakan masukkan password baru untuk mengamankan kembali akun kamu.
            </p>

            <div className="text-left">
              <Field label="Password Baru">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Minimal 6 karakter" 
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="form-input rounded-xl"
                  aria-invalid={err ? "true" : "false"}
                />
              </Field>
            </div>

            {err && (
              <p className="text-expense text-xs font-bold text-left mt-2 animate-pulse" role="alert">
                {err}
              </p>
            )}

            <button 
              onClick={handleUpdate} 
              disabled={busy || newPass.length < 1}
              className="btn-primary w-full py-4 mt-6 shadow-lg shadow-primary/20"
              aria-label="Simpan password baru"
            >
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Simpan Password Baru'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}