import { useState, useEffect, useRef } from 'react'
import { Plus, X, ArrowDownLeft, ArrowUpRight, Loader2, CheckCircle2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { today, CATEGORY_TREE } from '../lib/utils'

export default function QuickAdd() {
  const { addTx, walletData } = useData()

  const [open, setOpen]     = useState(false)
  const [type, setType]     = useState('out')
  const [amount, setAmount] = useState('')
  const [desc, setDesc]     = useState('')
  const [cat, setCat]       = useState('')
  const [busy, setBusy]     = useState(false)
  const [done, setDone]     = useState(false)
  const [err, setErr]       = useState('')
  const amountRef = useRef(null)

  const mainCats  = Object.keys(CATEGORY_TREE[type] || {})
  const walletId  = walletData?.[0]?.id || null

  // Focus amount saat form buka
  useEffect(() => {
    if (open) { setTimeout(() => amountRef.current?.focus(), 100); setCat(''); setAmount(''); setDesc(''); setErr('') }
  }, [open])

  // Reset type → reset category
  useEffect(() => { setCat('') }, [type])

  const handleSubmit = async () => {
    if (!amount || +amount <= 0) { setErr('Jumlah wajib diisi'); return }
    if (!desc.trim())            { setErr('Keterangan wajib diisi'); return }
    if (!cat)                    { setErr('Pilih kategori'); return }

    setBusy(true); setErr('')
    const err = await addTx({
      desc: desc.trim(),
      amount: parseFloat(amount),
      type,
      cat,
      sub_cat: '',
      date: today(),
      wallet_id: walletId
    })
    setBusy(false)

    if (err) { setErr(err.message || 'Gagal menyimpan'); return }

    setDone(true)
    setTimeout(() => { setDone(false); setOpen(false); setAmount(''); setDesc(''); setCat('') }, 1200)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm bg-surface border border-border rounded-3xl shadow-2xl animate-fade-up p-5 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="font-bold text-text">Catat Cepat</p>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl text-muted hover:text-text hover:bg-bg transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-bg border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setType('out')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${type === 'out' ? 'bg-expense-light text-expense shadow-sm' : 'text-muted hover:text-text'}`}
            >
              <ArrowUpRight size={14} /> Keluar
            </button>
            <button
              onClick={() => setType('in')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${type === 'in' ? 'bg-income-light text-income shadow-sm' : 'text-muted hover:text-text'}`}
            >
              <ArrowDownLeft size={14} /> Masuk
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Jumlah (Rp)</label>
            <input
              ref={amountRef}
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErr('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border border-border outline-none focus:border-primary text-text text-lg font-bold tabular-nums transition-colors"
              placeholder="0"
              inputMode="numeric"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Keterangan</label>
            <input
              type="text"
              value={desc}
              onChange={e => { setDesc(e.target.value); setErr('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-bg border border-border outline-none focus:border-primary text-text text-sm font-medium transition-colors"
              placeholder="Contoh: Makan siang..."
              maxLength={60}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Kategori</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {mainCats.slice(0, 8).map(c => (
                <button
                  key={c}
                  onClick={() => { setCat(c); setErr('') }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    cat === c
                      ? type === 'out' ? 'bg-expense text-white' : 'bg-income text-white'
                      : 'bg-bg border border-border text-text-2 hover:border-border2'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {err && <p className="text-xs font-bold text-expense">{err}</p>}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy || done}
            className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
              done
                ? 'bg-income text-white'
                : type === 'out'
                  ? 'bg-expense text-white hover:opacity-90'
                  : 'bg-income text-white hover:opacity-90'
            } disabled:opacity-60`}
          >
            {done   ? <><CheckCircle2 size={16} /> Tersimpan!</> :
             busy   ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> :
             type === 'out' ? 'Catat Pengeluaran' : 'Catat Pemasukan'}
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(p => !p)}
        aria-label="Tambah transaksi cepat"
        className={`fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-text text-bg rotate-45 scale-90'
            : 'bg-primary text-white hover:scale-110 hover:shadow-primary/40 animate-bounce-slow'
        }`}
        style={{ boxShadow: open ? undefined : '0 8px 32px rgba(79, 70, 229, 0.4)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </>
  )
}
