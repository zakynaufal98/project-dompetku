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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none bg-white dark:bg-[#121629] pr-2 z-10 transition-colors">
        {CAT_ICONS[value] || <Tag size={18} className="text-slate-400 dark:text-slate-500" />}
      </div>

      {/* 2. Kolom Input Teks */}
      <input
        type="text"
        className="w-full bg-white dark:bg-[#121629] border border-slate-200 dark:border-slate-700 rounded-xl pl-[2.75rem] pr-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all"
        placeholder="Ketik atau pilih kategori..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true) 
        }}
        onFocus={() => setIsOpen(true)} 
      />

      {/* 3. Pop-up Suggestion List */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar overflow-hidden animate-fade-in transition-colors">
          {filtered.map(c => (
            <li
              key={c}
              onClick={() => {
                onChange(c) 
                setIsOpen(false) 
              }}
              className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-800/50 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
            >
              <span className="opacity-70 scale-90 dark:opacity-100">{CAT_ICONS[c] || <Tag size={18} className="text-slate-400 dark:text-slate-500"/>}</span>
              {c}
            </li>
          ))}
        </ul>
      )}
      
    </div>
  )
}