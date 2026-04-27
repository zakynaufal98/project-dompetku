import { useState, useRef, useEffect } from 'react'
import { CATEGORIES, CAT_ICONS } from '../lib/utils'
import { Tag } from 'lucide-react'

export default function CategoryInput({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  // Filter daftar kategori berdasarkan teks yang diketik user
  const filtered = CATEGORIES.filter(c =>
    c.toLowerCase().includes((value || '').toLowerCase())
  )

  // Efek: Jika user klik di luar kotak, tutup dropdown suggestion-nya
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
      
      {/* 1. Ikon Dinamis di dalam Input */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none bg-white pr-2 z-10">
        {CAT_ICONS[value] || <Tag size={18} className="text-slate-400" />}
      </div>

      {/* 2. Kolom Input Teks */}
      <input
        type="text"
        className="w-full bg-white border border-slate-200 rounded-xl pl-[2.75rem] pr-4 pl-12 py-3 text-sm font-semibold text-slate-800 focus:border-indigo-500 outline-none transition-all"
        placeholder="Ketik atau pilih kategori..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true) // Otomatis buka suggestion saat mengetik
        }}
        onFocus={() => setIsOpen(true)} // Buka suggestion saat diklik
      />

      {/* 3. Pop-up Suggestion List */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-[220px] overflow-y-auto custom-scrollbar overflow-hidden animate-fade-in">
          {filtered.map(c => (
            <li
              key={c}
              onClick={() => {
                onChange(c) // Set value saat diklik
                setIsOpen(false) // Langsung tutup
              }}
              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-700 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
            >
              <span className="opacity-70 scale-90">{CAT_ICONS[c] || <Tag size={18}/>}</span>
              {c}
            </li>
          ))}
        </ul>
      )}
      
    </div>
  )
}