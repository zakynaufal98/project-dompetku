import { useState, useRef, useEffect, useMemo } from 'react'
import { Pencil } from 'lucide-react'

export default function DescInput({ value, onChange, txData, onEnter }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Ambil riwayat keterangan yang unik dari database, urutkan dari yang paling baru
  const historyDescs = useMemo(() => {
    // Kita balik (reverse) agar transaksi terbaru ada di paling atas
    const recentTx = [...txData].reverse()
    const descs = recentTx.map(t => t.desc).filter(Boolean)
    return [...new Set(descs)] // Hapus duplikat
  }, [txData])

  // Filter berdasarkan apa yang diketik (maksimal tampil 5 saran agar rapi)
  const filtered = value
    ? historyDescs.filter(d => d.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : historyDescs.slice(0, 5) // Jika kosong, tampilkan 5 riwayat terakhir

  // Tutup dropdown jika klik di luar area
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={wrapperRef}>
      
      {/* Ikon Pensil */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none z-10 transition-colors">
        <Pencil size={16} strokeWidth={2.5} />
      </div>

      {/* Input Teks */}
      <input
        type="text"
        className="form-input w-full pl-14 pr-4 py-3 text-sm transition-all"
        placeholder="Mis. Gaji bulanan..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            setIsOpen(false)
            onEnter() // Eksekusi fungsi simpan jika tekan Enter
          }
        }}
      />

      {/* Pop-up Suggestion (Hanya muncul jika ada riwayat) */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar overflow-hidden animate-fade-in transition-colors">
          {filtered.map((d, i) => (
            <li
              key={i}
              onClick={() => {
                onChange(d)
                setIsOpen(false)
              }}
              className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800/50 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
            >
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}