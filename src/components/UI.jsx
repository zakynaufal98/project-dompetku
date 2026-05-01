import { useState, useMemo, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Loader2, ReceiptText, BriefcaseBusiness, PieChart as PieChartIcon, ArrowLeft, ChevronDown } from 'lucide-react'
import { fmtShort, CAT_ICONS, INV_TYPES, CHART_COLORS } from '../lib/utils' 

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

export const TxItem = ({ t, onDelete, isInv, walletName, inputterName }) => { 
  const isOut = isInv ? t.action === 'beli' : t.type === 'out';
  
  let IconElement;
  if (isInv) {
    IconElement = (INV_TYPES && t.invType && INV_TYPES[t.invType]) 
      ? INV_TYPES[t.invType].icon 
      : <BriefcaseBusiness size={18} strokeWidth={2.5} />;
  } else {
    const mainCatIcon = t.cat ? t.cat : 'Lainnya';
    IconElement = (CAT_ICONS && CAT_ICONS[mainCatIcon]) 
      ? CAT_ICONS[mainCatIcon] 
      : <ReceiptText size={18} strokeWidth={2.5} />;
  }

  let catText = '';
  if (isInv) {
    catText = `${t.action === 'beli' ? 'Beli' : 'Jual'} ${t.invType || 'Aset'} ${t.subType ? `• ${t.subType}` : ''}`;
  } else {
    const mainCat = t.cat || 'Lainnya';
    let subCat = '';
    if (t.sub_cat && t.sub_cat !== mainCat) {
      subCat = t.sub_cat;
    } else if (!t.sub_cat && t.cat !== 'Transfer') { 
      subCat = 'Lain-lain';
    }
    catText = subCat ? (
      <>{mainCat} <span className="text-[10px] mx-1 opacity-50">▶</span> {subCat}</>
    ) : mainCat;
  }

  const dateDisplay = t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="flex items-start sm:items-center justify-between p-3.5 bg-surface border border-border rounded-2xl hover:border-border2 transition-colors group gap-3">
      {/* LEFT: Icon + Info */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 sm:mt-0 ${
          isOut ? 'bg-gold-light text-gold' : 'bg-income-light text-income'
        }`}>
          {IconElement}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-text leading-tight break-words">{t.desc}</p>
          
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {dateDisplay && (
              <span className="text-[9px] font-bold text-muted bg-border px-1.5 py-0.5 rounded uppercase tracking-wider">
                {dateDisplay}
              </span>
            )}
            <span className="text-[11px] font-semibold text-muted2 flex items-center flex-wrap">
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
            {inputterName && (
              <>
                <span className="w-1 h-1 rounded-full bg-border2"></span>
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                  ✏️ {inputterName}
                </span>
              </>
            )}
          </div>

          {/* Amount shown inline on mobile only */}
          <div className="flex items-center gap-2 mt-2 sm:hidden">
            <span className={`font-black text-sm tabular-nums tracking-tight ${isOut ? 'text-text-2' : 'text-income'}`}>
              {isOut ? '-' : '+'}{fmtShort(t.amount)}
            </span>
            {onDelete && (
              <button onClick={(e) => {
                e.stopPropagation();
                onDelete(t.id);
              }} className="w-7 h-7 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-full transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Amount + Delete (Desktop only) */}
      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
        <span className={`font-black text-sm tabular-nums tracking-tight ${isOut ? 'text-text-2' : 'text-income'}`}>
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

export function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-muted2 py-6">
      {icon}
      <p className="text-sm font-medium mt-2">{text}</p>
    </div>
  )
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            value === o.value ? 'bg-expense-light text-expense border border-expense/20' : 'bg-surface text-muted2 border border-border2 hover:border-border'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-muted ml-1">{label}</label>
      {children}
    </div>
  )
}

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

export function SummaryRow({ label, value, valueClass }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <span className={`tabular-nums text-base ${valueClass}`}>{value}</span>
    </div>
  )
}

export function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden mt-1.5">
      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 16, md: 24, lg: 32 }
  return <Loader2 size={sizes[size] || 24} className="text-income animate-spin" />
}

export function MetricCard({ icon, label, value, tone }) {
  const tones = { income: 'bg-income-light text-income', gold: 'bg-gold-light text-gold', invest: 'bg-invest-light text-invest', expense: 'bg-expense-light text-expense' }
  return (
    <div className="bg-surface border border-border rounded-[20px] p-5 shadow-sm transition-colors">
      <div className={`w-9 h-9 rounded-xl ${tones[tone]} flex items-center justify-center mb-4 transition-colors`}>{icon}</div>
      <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="font-black text-text tabular-nums tracking-tight">{value}</p>
    </div>
  )
}

export function Insight({ icon, title, text }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-bg transition-colors">
      <div className="w-8 h-8 rounded-lg bg-surface text-income flex items-center justify-center flex-shrink-0 transition-colors">{icon}</div>
      <div>
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="text-xs font-medium text-muted leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// ✨ KOMPONEN SUPER: INTERACTIVE DONUT DRILL-DOWN ✨
// ---------------------------------------------------------
const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-xs shadow-lg">
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function InteractiveDonut({ data }) {
  const [activeCat, setActiveCat] = useState(null)
  
  // 👇 1. Buat Referensi (Ref) untuk membungkus area Donut
  const donutRef = useRef(null)

  // 👇 2. Pasang pendeteksi klik global
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Jika yang diklik BUKAN bagian dalam area Donut, reset tampilan!
      if (donutRef.current && !donutRef.current.contains(event.target)) {
        setActiveCat(null)
      }
    }
    
    // Dengarkan setiap klik ('mousedown' lebih responsif dari 'click' di UI)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const { donutD, groupedOut, totalAll } = useMemo(() => {
    const m = {}
    let tAll = 0;
    
    data.forEach(t => {
      const mainCat = t.cat || 'Lainnya'
      const subCat = t.sub_cat || 'Lain-lain'

      if (!m[mainCat]) m[mainCat] = { total: 0, subs: {} }
      m[mainCat].total += t.amount
      m[mainCat].subs[subCat] = (m[mainCat].subs[subCat] || 0) + t.amount
      tAll += t.amount;
    })

    const grouped = Object.entries(m)
      .sort((a,b) => b[1].total - a[1].total)
      .map(([main, d]) => ({
        main,
        total: d.total,
        subs: Object.entries(d.subs).sort((a,b) => b[1] - a[1])
      }))

    const donut = grouped.map((g, i) => ({
      name: g.main,
      value: g.total,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }))

    return { donutD: donut, groupedOut: grouped, totalAll: tAll }
  }, [data])

  if (!donutD.length) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center opacity-50 min-h-[250px]">
        <PieChartIcon size={48} className="text-muted2 mb-3" strokeWidth={1}/>
        <p className="text-sm font-medium">Belum ada pengeluaran</p>
      </div>
    )
  }

  return (
    // 👇 3. Pasang Ref di elemen pembungkus terluar Donut
    <div className="flex-1 flex flex-col mt-4" ref={donutRef}>
      {/* Area Donut */}
      <div className="h-[220px] mb-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={donutD} cx="50%" cy="50%" innerRadius={70} outerRadius={90} 
              dataKey="value" stroke="none"
              onClick={(d) => setActiveCat(activeCat === d.name ? null : d.name)}
              className="cursor-pointer outline-none"
            >
              {donutD.map((entry, i) => (
                <Cell 
                  key={`cell-${i}`} fill={entry.fill} 
                  opacity={activeCat && activeCat !== entry.name ? 0.2 : 1}
                  style={{ transition: 'opacity 0.3s ease' }}
                />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Teks Tengah */}
        {!activeCat && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-muted2 font-bold uppercase tracking-widest text-center">Total</span>
            <span className="tabular-nums font-bold text-xl text-text tracking-tight mt-0.5">{fmtShort(totalAll)}</span>
          </div>
        )}
      </div>

      {/* Area Legend Interaktif */}
      <div className="mt-4 transition-all duration-300 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        {!activeCat ? (
          <div className="space-y-1 animate-fade-in">
            {groupedOut.map((group, i) => (
              <div key={group.main} onClick={() => setActiveCat(group.main)} className="flex justify-between items-center p-2 rounded-xl hover:bg-bg cursor-pointer transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                  <span className="text-sm font-semibold text-text-2">{group.main}</span>
                </div>
                <span className="text-sm font-bold text-text tabular-nums">{fmtShort(group.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg border border-border2 rounded-2xl p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-border2 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: donutD.find(d => d.name === activeCat)?.fill }}></div>
                <span className="text-sm font-bold text-text">{activeCat}</span>
              </div>
              {/* Tombol kembali tetap dipertahankan karena secara UX pengguna kadang bingung jika tidak ada tombol eksplisit */}
              <button onClick={() => setActiveCat(null)} className="flex items-center gap-1 bg-surface hover:bg-border border border-border2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-text-2 transition-colors cursor-pointer">
                <ArrowLeft size={12} /> Kembali
              </button>
            </div>
            <div className="space-y-3">
              {groupedOut.find(g => g.main === activeCat)?.subs.map(([subName, subVal]) => (
                <div key={subName} className="flex justify-between items-center pl-1">
                  <span className="text-xs font-semibold text-muted2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-muted"></span>{subName}</span>
                  <span className="text-xs font-bold text-text tabular-nums">{fmtShort(subVal)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}