import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react'

export default function RecoveryModal() {
  const { recoveryMode, setRecoveryMode, updatePassword } = useAuth()
  const [newPass, setNewPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)

  // Jika tidak dalam mode recovery, sembunyikan modal ini
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
      // Tutup modal setelah 2 detik
      setTimeout(() => setRecoveryMode(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-up text-center">
        
        {success ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 size={60} className="text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-slate-800">Berhasil!</h3>
            <p className="text-slate-500 mt-2 font-medium">Password kamu telah diperbarui.</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <KeyRound size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Buat Password Baru</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Silakan masukkan password baru untuk akun kamu.
            </p>

            <input 
              type="password" 
              placeholder="Minimal 6 karakter" 
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:border-indigo-500 outline-none mb-2"
            />
            {err && <p className="text-rose-500 text-xs font-bold text-left mb-4">{err}</p>}

            <button 
              onClick={handleUpdate} 
              disabled={busy}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center mt-4"
            >
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Simpan Password Baru'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}