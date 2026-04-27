import { Trash2, Loader2 } from 'lucide-react'
import { fmtShort, CAT_ICONS } from '../lib/utils'

// 1. KOMPONEN ITEM TRANSAKSI (Dengan Fix Alignment)
// 1. KOMPONEN ITEM TRANSAKSI (Dengan Fix Ikon '?')
export function TxItem({ t, onDelete, isInv }) {
  // Cek pengeluaran: Mendukung data transaksi biasa (type) dan aset (action)
  const isOut = t.type === 'out' || t.action === 'beli'
  
  // FALLBACK CERDAS: Jika 'cat' kosong, otomatis isi dengan 'Pemasukan' atau 'Investasi'
  const categoryName = t.cat || (isInv ? 'Investasi' : 'Pemasukan')
  
  // FALLBACK CERDAS: Jika 'desc' kosong, otomatis ambil dari 'name' (untuk data Aset)
  const itemName = t.desc || t.name || 'Tanpa Keterangan'

  return (
    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-[16px] hover:border-indigo-100 transition-colors shadow-sm mb-2 last:mb-0">
      
      {/* Bagian Kiri: Ikon & Detail */}
      <div className="flex items-center gap-4 overflow-hidden">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {/* Prioritas: 1. Ikon Utils, 2. Huruf Pertama dari Kategori */}
          {CAT_ICONS[categoryName] || <span className="font-bold">{categoryName.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-slate-800 text-sm truncate">{itemName}</h4>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
             {t.date} • {categoryName}
          </p>
        </div>
      </div>

      {/* Bagian Kanan: Nominal & Tombol Hapus */}
      <div className="flex items-center justify-end gap-3 pl-3">
        <span className={`tabular-nums font-bold text-sm flex-shrink-0 ${isOut ? 'text-rose-600' : 'text-[#3b82f6]'}`}>
          {isOut ? '-' : '+'}{fmtShort(t.amount)}
        </span>
        
        {onDelete ? (
          <button 
            onClick={() => onDelete(t.id)} 
            className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg flex-shrink-0"
            title="Hapus Transaksi"
          >
            <Trash2 size={16} />
          </button>
        ) : (
          <div className="w-[28px] h-[28px] flex-shrink-0 pointer-events-none"></div>
        )}
      </div>

    </div>
  )
}

// 2. KOMPONEN EMPTY STATE
export function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-slate-400 py-6">
      {icon}
      <p className="text-sm font-medium mt-2">{text}</p>
    </div>
  )
}

// 3. KOMPONEN TABS (Untuk Filter)
export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            value === o.value 
              ? 'bg-rose-50 text-rose-500 border border-rose-100' 
              : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// 4. KOMPONEN FIELD WRAPPER (Untuk Form)
export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 ml-1">{label}</label>
      {children}
    </div>
  )
}

// 5. KOMPONEN PANEL HEADER
export function PanelHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
      <h3 className="font-bold text-slate-800 text-base">{title}</h3>
      {badge && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider">{badge}</span>}
    </div>
  )
}

// 6. KOMPONEN SUMMARY ROW (Untuk Ringkasan)
export function SummaryRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`tabular-nums text-base ${valueClass}`}>{value}</span>
    </div>
  )
}

// 7. KOMPONEN PROGRESS BAR (Untuk Grafik Analitik)
export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${pct}%`, backgroundColor: color }} 
      />
    </div>
  )
}

// 8. KOMPONEN DONUT LEGEND (Untuk Dashboard)
export function DonutLegend({ data }) {
  // Urutkan dari pengeluaran terbesar dan ambil 4 teratas saja
  const entries = Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0,4)
  
  return (
    <div className="space-y-2.5 mt-2">
      {entries.map(([cat, val]) => (
        <div key={cat} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
          <span className="font-semibold text-slate-500 truncate pr-4">{cat}</span>
          <span className="tabular-nums font-bold text-slate-800 flex-shrink-0">{fmtShort(val)}</span>
        </div>
      ))}
    </div>
  )
}

// 9. KOMPONEN SPINNER (Loading Animation)
export function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32
  }
  return (
    <Loader2 
      size={sizes[size] || 24} 
      className="text-indigo-600 animate-spin" 
    />
  )
}