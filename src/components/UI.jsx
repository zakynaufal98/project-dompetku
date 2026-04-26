import { fmt, fmtShort, CHART_COLORS, CAT_ICONS, INV_TYPES } from '../lib/utils'
import { Trash2, BoxSelect, Loader2 } from 'lucide-react'

// ── STAT CARD ─────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, accent, light }) {
  return (
    <div className="card p-5 flex flex-col gap-1 transition-transform hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 ${light}`}>
        {icon}
      </div>
      <p className="text-xs text-muted font-bold uppercase tracking-wider">{label}</p>
      <p className={`tabular-nums  font-bold text-2xl ${accent}`}>{value}</p>
      {sub && <p className="text-sm text-muted font-medium mt-1">{sub}</p>}
    </div>
  )
}

// ── TX ITEM ───────────────────────────────────────────────
export function TxItem({ t, onDelete, isInv }) {
  // Menentukan apakah ini uang masuk atau keluar
  const isIncome = isInv ? t.action === 'jual' : t.type === 'in'
  
  // Mengambil warna dan tanda plus/minus
  const amtColor = isIncome ? 'text-income' : 'text-expense'
  const sign = isIncome ? '+' : '-'
  const iconBg = isIncome ? 'bg-income-light/50 text-income' : 'bg-expense-light/50 text-expense'

  // Mengambil Ikon dan Teks Judul
  let Icon
  let title
  let subtitle = t.date
  
  if (isInv) {
    Icon = INV_TYPES[t.invType]?.icon
    title = t.subType || t.invType
    if (t.qty > 0) subtitle += ` • ${t.qty} ${t.unit}`
  } else {
    // Jika pemasukan, gunakan icon dari text Pemasukan, jika tidak, cari dari kategori
    Icon = t.type === 'in' ? CAT_ICONS['Pemasukan'] : CAT_ICONS[t.cat]
    title = t.cat || (t.type === 'in' ? 'Pemasukan' : 'Pengeluaran')
    if (t.desc) subtitle += ` • ${t.desc}`
  }

  const isDeletable = typeof onDelete === 'function' && onDelete.toString() !== '()=>{}'

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 border-b border-border/40 transition-colors group rounded-2xl">
      <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`}>
          {Icon}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-text truncate">{title}</p>
          <p className="text-xs text-muted font-medium mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 pl-2">
        <div className="text-right">
          <p className={`tabular-nums  font-bold text-sm sm:text-base ${amtColor}`}>
            {sign}{fmtShort(t.amount)}
          </p>
        </div>
        
        {isDeletable && (
          <button
            onClick={() => onDelete(t.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-red-500 hover:shadow-md hover:shadow-red-500/20 transition-all cursor-pointer bg-white border border-slate-100 hover:border-red-500 opacity-0 group-hover:opacity-100"
            title="Hapus transaksi"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────
export function Empty({ icon, text = 'Belum ada data' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3 opacity-70">
      {/* Mengizinkan pengiriman komponen icon Lucide secara dinamis */}
      <div className="text-muted2 mb-1">
        {icon || <BoxSelect size={40} strokeWidth={1.5} />}
      </div>
      <p className="text-sm font-medium text-muted">{text}</p>
    </div>
  )
}

// ── SPINNER ───────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sz = { sm: 16, md: 32, lg: 48 }[size]
  return (
    <div className="flex items-center justify-center text-primary">
      <Loader2 size={sz} className="animate-spin" />
    </div>
  )
}

// ── DONUT LEGEND ──────────────────────────────────────────
export function DonutLegend({ data }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0)
  return (
    <div className="space-y-2 mt-3">
      {Object.entries(data).filter(([,v]) => v > 0).slice(0, 7).map(([cat, val], i) => (
        <div key={cat} className="flex items-center gap-3 text-xs p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="w-3 h-3 rounded-md flex-shrink-0 shadow-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="flex-1 font-semibold text-text-2 truncate">{cat}</span>
          <span className="text-muted font-medium w-8 text-right">{total ? (val/total*100).toFixed(0) : 0}%</span>
          <span className="tabular-nums  font-bold text-text w-20 text-right">{fmtShort(val)}</span>
        </div>
      ))}
    </div>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────
export function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ── PANEL HEADER ──────────────────────────────────────────
export function PanelHeader({ title, badge, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="tabular-nums  font-bold text-base md:text-lg text-text tracking-tight">{title}</h3>
      <div className="flex items-center gap-2">
        {badge !== undefined && (
          <span className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-bold tracking-wide uppercase">{badge}</span>
        )}
        {action}
      </div>
    </div>
  )
}

// ── FIELD WRAPPER ─────────────────────────────────────────
export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="form-label font-bold text-muted text-xs uppercase tracking-wider mb-2 block">{label}</label>
      {children}
    </div>
  )
}

// ── SEGMENT CONTROL ───────────────────────────────────────
export function SegControl({ value, onChange, options }) {
  return (
    <div className="seg-control mb-4 bg-slate-100/70 p-1.5 rounded-2xl">
      {options.map(opt => (
        <button key={opt.value}
          className={`seg-btn py-2.5 rounded-xl text-sm transition-all duration-300 font-bold ${value === opt.value ? 'active bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── TABS ──────────────────────────────────────────────────
export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex gap-2.5 flex-wrap mb-5">
      {options.map(opt => (
        <button key={opt.value}
          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
            value === opt.value 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-white text-muted border-border hover:border-border2 hover:bg-slate-50'
          }`}
          onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── DIVIDER ───────────────────────────────────────────────
export function Divider() {
  return <div className="border-t border-border mx-1 my-2" />
}

// ── SUMMARY ROW ───────────────────────────────────────────
export function SummaryRow({ label, value, valueClass = 'text-text', sub }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl px-2">
      <span className="text-sm font-semibold text-text-2">{label}</span>
      <div className="text-right">
        <span className={`text-base tabular-nums  ${valueClass}`}>{value}</span>
        {sub && <p className="text-xs text-muted font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}