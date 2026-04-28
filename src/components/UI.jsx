import { useState } from 'react'
import { Trash2, Loader2, ArrowDownLeft, ArrowUpRight, ReceiptText, BriefcaseBusiness } from 'lucide-react'
import { fmtShort, CAT_ICONS, INV_TYPES } from '../lib/utils' // Ditambahkan INV_TYPES

// ---------------------------------------------------------
// KOMPONEN: Logo Bank Asli (Dengan API & Fallback)
// ---------------------------------------------------------
export const BankLogo = ({ name = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  if (!name) return null;
  const n = name.toLowerCase();
  
  let brand = { text: name.substring(0, 2).toUpperCase(), bg: 'bg-slate-700', domain: null };
  
  if (n.includes('bca')) brand = { text: 'BCA', bg: 'bg-blue-600', domain: 'bca.co.id' };
  else if (n.includes('jago')) brand = { text: 'Jago', bg: 'bg-orange-500', domain: 'jago.com' };
  else if (n.includes('mandiri') || n.includes('livin')) brand = { text: 'Livin', bg: 'bg-yellow-400', textCol: 'text-blue-900', domain: 'bankmandiri.co.id' };
  else if (n.includes('bni')) brand = { text: 'BNI', bg: 'bg-teal-500', domain: 'bni.co.id' };
  else if (n.includes('bri')) brand = { text: 'BRI', bg: 'bg-blue-800', domain: 'bri.co.id' };
  else if (n.includes('bsi')) brand = { text: 'BSI', bg: 'bg-emerald-600', domain: 'bankbsi.co.id' };
  else if (n.includes('gopay')) brand = { text: 'GoPay', bg: 'bg-sky-500', domain: 'gopay.co.id' };
  else if (n.includes('ovo')) brand = { text: 'OVO', bg: 'bg-purple-600', domain: 'ovo.id' };
  else if (n.includes('dana')) brand = { text: 'DANA', bg: 'bg-blue-500', domain: 'dana.id' };
  else if (n.includes('seabank')) brand = { text: 'Sea', bg: 'bg-orange-500', domain: 'seabank.co.id' };
  else if (n.includes('jenius')) brand = { text: 'Jenius', bg: 'bg-cyan-500', domain: 'jenius.com' };
  else if (n.includes('tunai') || n.includes('cash')) brand = { text: 'Cash', bg: 'bg-emerald-500', domain: null };

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[8px]' : 'w-9 h-9 text-[10px]';

  if (brand.domain && !imgError) {
    return (
      <div className={`${sizeClasses} rounded-full flex items-center justify-center flex-shrink-0 bg-white border border-slate-100 overflow-hidden shadow-sm p-0.5`}>
        <img
          src={`https://logo.clearbit.com/${brand.domain}`}
          alt={brand.text}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses} ${brand.bg} ${brand.textCol || 'text-white'} rounded-full flex items-center justify-center font-black tracking-tighter shadow-sm flex-shrink-0`}>
      {brand.text}
    </div>
  )
}

// ---------------------------------------------------------
// 1. KOMPONEN ITEM TRANSAKSI (Lebih Cerdas & Detail)
// ---------------------------------------------------------
export const TxItem = ({ t, onDelete, isInv, walletName }) => { 
  // 1. Tentukan Arah Uang
  // Jika Investasi: Beli = Uang Keluar (isOut: true), Jual = Uang Masuk
  const isOut = isInv ? t.action === 'beli' : t.type === 'out';
  
  // 2. Tentukan Ikon yang Benar
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

  // 3. Tentukan Label Kategori yang Detail
  const catText = isInv 
    ? `${t.action === 'beli' ? 'Beli' : 'Jual'} ${t.invType || 'Aset'} ${t.subType ? `• ${t.subType}` : ''}`
    : t.cat;

  const dateDisplay = t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors group">
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isOut ? 'bg-orange-50 text-orange-500' : 'bg-indigo-50 text-indigo-600'}`}>
          {/* Ikon spesifik akan muncul di sini */}
          {IconElement}
        </div>
        <div>
          <p className="font-bold text-sm text-slate-800 line-clamp-1 leading-tight">{t.desc}</p>
          
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            
            {/* TANGGAL TRANSAKSI */}
            {dateDisplay && (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {dateDisplay}
              </span>
            )}

            {/* LABEL DETAIL (Contoh: Beli Saham • BBCA) */}
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              {catText}
            </span>
            
            {/* LOGO BANK */}
            {walletName && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="flex items-center gap-1">
                  <BankLogo name={walletName} size="sm" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{walletName}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-black text-sm tabular-nums tracking-tight ${isOut ? 'text-slate-700' : 'text-indigo-600'}`}>
          {isOut ? '-' : '+'}{fmtShort(t.amount)}
        </span>
        {onDelete && (
          <button onClick={(e) => {
            e.stopPropagation(); // Mencegah memicu klik form Edit secara tidak sengaja
            onDelete(t.id);
          }} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
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
    <div className="flex flex-col items-center justify-center text-slate-400 py-6">
      {icon}
      <p className="text-sm font-medium mt-2">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------
// 3. KOMPONEN TABS (Untuk Filter)
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

// ---------------------------------------------------------
// 4. KOMPONEN FIELD WRAPPER (Untuk Form)
// ---------------------------------------------------------
export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 ml-1">{label}</label>
      {children}
    </div>
  )
}

// ---------------------------------------------------------
// 5. KOMPONEN PANEL HEADER
// ---------------------------------------------------------
export function PanelHeader({ title, badge }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
      <h3 className="font-bold text-slate-800 text-base">{title}</h3>
      {badge && <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider">{badge}</span>}
    </div>
  )
}

// ---------------------------------------------------------
// 6. KOMPONEN SUMMARY ROW (Untuk Ringkasan)
// ---------------------------------------------------------
export function SummaryRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`tabular-nums text-base ${valueClass}`}>{value}</span>
    </div>
  )
}

// ---------------------------------------------------------
// 7. KOMPONEN PROGRESS BAR (Untuk Grafik Analitik)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 8. KOMPONEN DONUT LEGEND (Untuk Dashboard)
// ---------------------------------------------------------
export function DonutLegend({ data }) {
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

// ---------------------------------------------------------
// 9. KOMPONEN SPINNER (Loading Animation)
// ---------------------------------------------------------
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  return <Loader2 size={sizes[size] || 24} className="text-indigo-600 animate-spin" />
}