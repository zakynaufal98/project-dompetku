import { Trash2, Loader2, ArrowDownLeft, ArrowUpRight, ReceiptText, BriefcaseBusiness } from 'lucide-react'
import { fmtShort, CAT_ICONS, INV_TYPES } from '../lib/utils' 

// ---------------------------------------------------------
// KOMPONEN: Logo Bank Lokal
// ---------------------------------------------------------
export const BankLogo = ({ name = '', size = 'md' }) => {
  if (!name) return null;
  const n = name.toLowerCase();
  
  let brand = { text: name.substring(0, 2).toUpperCase(), bg: 'bg-slate-700' };
  
  if (n.includes('bca')) brand = { text: 'BCA', bg: 'bg-blue-600' };
  else if (n.includes('jago')) brand = { text: 'Jago', bg: 'bg-orange-500' };
  else if (n.includes('mandiri') || n.includes('livin')) brand = { text: 'Livin', bg: 'bg-yellow-400', textCol: 'text-blue-900' };
  else if (n.includes('bni')) brand = { text: 'BNI', bg: 'bg-teal-500' };
  else if (n.includes('bri')) brand = { text: 'BRI', bg: 'bg-blue-800' };
  else if (n.includes('bsi')) brand = { text: 'BSI', bg: 'bg-emerald-600' };
  else if (n.includes('gopay')) brand = { text: 'GoPay', bg: 'bg-sky-500' };
  else if (n.includes('ovo')) brand = { text: 'OVO', bg: 'bg-purple-600' };
  else if (n.includes('dana')) brand = { text: 'DANA', bg: 'bg-blue-500' };
  else if (n.includes('seabank')) brand = { text: 'Sea', bg: 'bg-orange-500' };
  else if (n.includes('jenius')) brand = { text: 'Jenius', bg: 'bg-cyan-500' };
  else if (n.includes('tunai') || n.includes('cash')) brand = { text: 'Cash', bg: 'bg-emerald-500' };

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[8px]' : 'w-9 h-9 text-[10px]';
  
  return (
    <div className={`${sizeClasses} ${brand.bg} ${brand.textCol || 'text-white'} rounded-full flex items-center justify-center font-black tracking-tighter shadow-sm flex-shrink-0`}>
      {brand.text}
    </div>
  )
}

// ---------------------------------------------------------
// 1. KOMPONEN ITEM TRANSAKSI
// ---------------------------------------------------------
export const TxItem = ({ t, onDelete, isInv, walletName }) => { 
  const isOut = isInv ? t.action === 'beli' : t.type === 'out';
  
  let IconElement;
  if (isInv) {
    IconElement = (INV_TYPES && t.invType && INV_TYPES[t.invType]) 
      ? INV_TYPES[t.invType].icon 
      : <BriefcaseBusiness size={18} strokeWidth={2.5} />;
  } else {
    IconElement = (CAT_ICONS && CAT_ICONS[t.cat]) 
      ? CAT_ICONS[t.cat] 
      : <ReceiptText size={18} strokeWidth={2.5} />;
  }

  const catText = isInv 
    ? `${t.action === 'beli' ? 'Beli' : 'Jual'} ${t.invType || 'Aset'} ${t.subType ? `• ${t.subType}` : ''}`
    : t.cat;

  const dateDisplay = t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-2xl hover:border-border2 transition-colors group">
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isOut 
            ? 'bg-gold-light text-gold' 
            : 'bg-income-light text-income'
        }`}>
          {IconElement}
        </div>
        <div>
          <p className="font-bold text-sm text-text line-clamp-1 leading-tight">{t.desc}</p>
          
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {dateDisplay && (
              <span className="text-[9px] font-bold text-muted bg-border px-1.5 py-0.5 rounded uppercase tracking-wider">
                {dateDisplay}
              </span>
            )}
            <span className="text-[11px] font-semibold text-muted2 flex items-center gap-1">
              {catText}
            </span>
            {walletName && (
              <>
                <span className="w-1 h-1 rounded-full bg-border2"></span>
                <span className="flex items-center gap-1">
                  <BankLogo name={walletName} size="sm" />
                  <span className="text-[10px] font-bold text-muted2 uppercase">{walletName}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-black text-sm tabular-nums tracking-tight ${
          isOut ? 'text-text-2' : 'text-income'
        }`}>
          {isOut ? '-' : '+'}{fmtShort(t.amount)}
        </span>
        {onDelete && (
          <button onClick={(e) => {
            e.stopPropagation();
            onDelete(t.id);
          }} className="w-8 h-8 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// 2. KOMPONEN EMPTY STATE
// ---------------------------------------------------------
export function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-muted2 py-6">
      {icon}
      <p className="text-sm font-medium mt-2">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------
// 3. KOMPONEN TABS
// ---------------------------------------------------------
export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            value === o.value 
              ? 'bg-expense-light text-expense border border-expense/20' 
              : 'bg-surface text-muted2 border border-border2 hover:border-border'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------
// 4. KOMPONEN FIELD WRAPPER
// ---------------------------------------------------------
export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-muted ml-1">{label}</label>
      {children}
    </div>
  )
}

// ---------------------------------------------------------
// 5. KOMPONEN PANEL HEADER
// ---------------------------------------------------------
export function PanelHeader({ title, badge, icon }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
      <h3 className="font-bold text-text text-base flex items-center gap-2">
        {icon && <span className="text-muted2">{icon}</span>}
        {title}
      </h3>
      {badge && <span className="text-[10px] font-bold text-expense bg-expense-light px-2.5 py-1 rounded-md uppercase tracking-wider">{badge}</span>}
    </div>
  )
}

// ---------------------------------------------------------
// 6. KOMPONEN SUMMARY ROW
// ---------------------------------------------------------
export function SummaryRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className={`tabular-nums text-base ${valueClass}`}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------
// 7. KOMPONEN PROGRESS BAR
// ---------------------------------------------------------
export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden mt-1.5">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ width: `${pct}%`, backgroundColor: color }} 
      />
    </div>
  )
}

// ---------------------------------------------------------
// 8. KOMPONEN DONUT LEGEND
// ---------------------------------------------------------
export function DonutLegend({ data }) {
  const entries = Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0,4)
  
  return (
    <div className="space-y-2.5 mt-2">
      {entries.map(([cat, val]) => (
        <div key={cat} className="flex items-center justify-between text-xs border-b border-border pb-1.5 last:border-0 last:pb-0">
          <span className="font-semibold text-muted truncate pr-4">{cat}</span>
          <span className="tabular-nums font-bold text-text flex-shrink-0">{fmtShort(val)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------
// 9. KOMPONEN SPINNER
// ---------------------------------------------------------
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  return <Loader2 size={sizes[size] || 24} className="text-income animate-spin" />
}
