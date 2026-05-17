import { useState, useMemo, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Trash2, Loader2, ReceiptText, BriefcaseBusiness, PieChart as PieChartIcon, ArrowLeft, ChevronDown, Pencil, Check, X } from 'lucide-react'
import { fmt, fmtShort, CAT_ICONS, INV_TYPES, CHART_COLORS, getCashflowMainCategory, getExpenseDistributionCategory } from '../lib/utils'

export const BankLogo = ({ name = '', size = 'md' }) => {
  if (!name) return null;
  const n = name.toLowerCase();
  
  let brand = { text: name.substring(0, 2).toUpperCase(), bg: '#475569' };
  
  if (n.includes('bca') || n.includes('klikbca') || n.includes('blu'))     brand = { text: 'BCA', bg: '#003D79' };
  else if (n.includes('jago'))                                              brand = { text: 'Jago', bg: '#FF6B35' };
  else if (n.includes('mandiri') || n.includes('livin'))                    brand = { text: 'Livin', bg: '#003580', textCol: '#FFD700' };
  else if (n.includes('bni'))                                               brand = { text: 'BNI', bg: '#F26522' };
  else if (n.includes('bri') || n.includes('brimo'))                        brand = { text: 'BRI', bg: '#00529C' };
  else if (n.includes('bsi') || n.includes('syariah'))                      brand = { text: 'BSI', bg: '#00A34E' };
  else if (n.includes('cimb') || n.includes('niaga') || n.includes('octo')) brand = { text: 'CIMB', bg: '#7B1B2D' };
  else if (n.includes('permata'))                                           brand = { text: 'PMT', bg: '#005BAC' };
  else if (n.includes('danamon'))                                           brand = { text: 'DAN', bg: '#003E7E' };
  else if (n.includes('ocbc') || n.includes('nyala'))                       brand = { text: 'OCBC', bg: '#D8232A' };
  else if (n.includes('jenius') || n.includes('btpn'))                      brand = { text: 'JNS', bg: '#00B5E2' };
  else if (n.includes('gopay') || n.includes('gojek'))                      brand = { text: 'GPay', bg: '#00AED6' };
  else if (n.includes('ovo'))                                               brand = { text: 'OVO', bg: '#4C2A86' };
  else if (n.includes('dana'))                                              brand = { text: 'DANA', bg: '#108EE9' };
  else if (n.includes('shopee') || n.includes('spay'))                      brand = { text: 'SPay', bg: '#EE4D2D' };
  else if (n.includes('linkaja') || n.includes('link aja'))                 brand = { text: 'Link', bg: '#E2231B' };
  else if (n.includes('seabank') || n.includes('sea bank'))                 brand = { text: 'Sea', bg: '#FF6600' };
  else if (n.includes('tunai') || n.includes('cash') || n.includes('kas')) brand = { text: 'Cash', bg: '#16A34A' };

  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[8px]' : 'w-9 h-9 text-[10px]';
  
  return (
    <div 
      className={`${sizeClasses} rounded-full flex items-center justify-center font-black tracking-tighter shadow-sm flex-shrink-0`}
      style={{ backgroundColor: brand.bg, color: brand.textCol || '#fff' }}
    >
      {brand.text}
    </div>
  )
}

export const TxItem = ({ t, onDelete, onEdit, isInv, walletName, inputterName }) => {
  const [confirmDel, setConfirmDel] = useState(false)
  const isOut = isInv ? t.action === 'beli' : t.type === 'out';
  
  let IconElement;
  if (isInv) {
    IconElement = (INV_TYPES && t.invType && INV_TYPES[t.invType]) 
      ? INV_TYPES[t.invType].icon 
      : <BriefcaseBusiness size={18} strokeWidth={2.5} />;
  } else {
    const mainCatIcon = getCashflowMainCategory(t);
    IconElement = (CAT_ICONS && CAT_ICONS[mainCatIcon]) 
      ? CAT_ICONS[mainCatIcon] 
      : <ReceiptText size={18} strokeWidth={2.5} />;
  }

  let catText = '';
  if (isInv) {
    catText = `${t.action === 'beli' ? 'Beli' : 'Jual'} ${t.invType || 'Aset'} ${t.subType ? `• ${t.subType}` : ''}`;
  } else {
    const mainCat = getCashflowMainCategory(t);
    let subCat = '';
    if (t.sub_cat && t.sub_cat !== mainCat) {
      subCat = t.sub_cat;
    } else if (!t.sub_cat && mainCat !== 'Transfer') { 
      subCat = 'Lain-lain';
    }
    catText = subCat ? (
      <>{mainCat} <span className="text-[10px] mx-1 opacity-50">▶</span> {subCat}</>
    ) : mainCat;
  }

  const dateDisplay = t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-2xl hover:border-border2 transition-colors group gap-3">
      {/* LEFT: Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isOut ? 'bg-gold-light text-gold' : 'bg-income-light text-income'
        }`}>
          {IconElement}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-text leading-tight break-words">{t.desc?.replace(/#[HP]ID-[a-z0-9]{6}/gi, '').trim()}</p>

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

          {/* Amount + actions — mobile only */}
          <div className="flex items-center gap-2 mt-2.5 sm:hidden">
            <span className={`font-black text-sm tabular-nums tracking-tight flex-1 ${isOut ? 'text-text-2' : 'text-income'}`}>
              {isOut ? '-' : '+'}{fmtShort(t.amount)}
            </span>
            {!confirmDel && (
              <div className="flex items-center gap-1.5">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(t) }}
                    className="flex items-center gap-1 px-2.5 h-8 bg-primary/10 text-primary rounded-xl active:scale-95 transition-transform"
                    aria-label="Edit transaksi"
                  >
                    <Pencil size={12} />
                    <span className="text-[11px] font-bold">Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDel(true) }}
                    className="w-8 h-8 flex items-center justify-center bg-expense-light text-expense rounded-xl active:scale-95 transition-transform"
                    aria-label="Hapus transaksi"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
            {confirmDel && (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span className="text-[10px] font-bold text-expense">Hapus?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(t.id); setConfirmDel(false) }}
                  className="h-8 px-2.5 flex items-center gap-1 bg-expense text-white text-[11px] font-bold rounded-xl active:scale-95"
                >
                  <Check size={11} /> Ya
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDel(false) }}
                  className="w-8 h-8 flex items-center justify-center bg-border text-muted rounded-xl"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Amount + actions (Desktop) */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        {!confirmDel ? (
          <>
            <span className={`font-black text-sm tabular-nums tracking-tight mr-1 ${isOut ? 'text-text-2' : 'text-income'}`}>
              {isOut ? '-' : '+'}{fmtShort(t.amount)}
            </span>
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(t) }}
                className="w-8 h-8 flex items-center justify-center text-muted2 hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); setConfirmDel(true) }}
                className="w-8 h-8 flex items-center justify-center text-muted2 hover:text-expense hover:bg-expense-light rounded-full transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={15} />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <span className="text-[11px] font-bold text-expense">Hapus?</span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); setConfirmDel(false) }}
              className="w-7 h-7 flex items-center justify-center bg-expense text-white rounded-full hover:bg-expense/80 transition-colors">
              <Check size={13} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDel(false) }}
              className="w-7 h-7 flex items-center justify-center bg-border text-muted rounded-full hover:bg-border2 transition-colors">
              <X size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] bg-bg px-6 py-10 text-center text-muted">
      {icon}
      <p className="mt-3 text-sm font-medium">{text}</p>
    </div>
  )
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            value === o.value ? 'bg-primary text-text border border-primary' : 'bg-surface text-muted border border-border hover:bg-primary-pale hover:text-text'
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
      <label className="ml-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{label}</label>
      {children}
    </div>
  )
}

export function PanelHeader({ title, badge, icon, sub }) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg text-text border border-border">
            {icon}
          </div>
        )}
        <div>
          {sub && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{sub}</p>}
          <h3 className="text-xl font-black tracking-tight text-text">{title}</h3>
        </div>
      </div>
      {badge && (
        <span className="rounded-full bg-primary-pale px-3 py-1 text-[11px] font-bold text-text">
          {badge}
        </span>
      )}
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

export function BreakdownPanel({ title = 'Cara angka dihitung', summary, note }) {
  const rows = [
    { key: 'realIncome', label: 'Pemasukan riil', value: summary?.realIncome || 0, className: 'text-income' },
    { key: 'actualOut', label: 'Uang keluar aktual', value: -(summary?.actualOut || 0), className: 'text-gold' },
    summary?.investmentLiquidation > 0
      ? { key: 'investmentLiquidation', label: 'Pencairan investasi', value: summary.investmentLiquidation, className: 'text-invest' }
      : null,
    summary?.investmentProfit > 0
      ? { key: 'investmentProfit', label: 'Profit investasi', value: summary.investmentProfit, className: 'text-income' }
      : null,
    summary?.excludedIn > 0
      ? { key: 'excludedIn', label: 'Dana non-pendapatan yang meng-offset beban', value: summary.excludedIn, className: 'text-invest' }
      : null,
    summary?.internalTransferIn > 0 || summary?.internalTransferOut > 0
      ? { key: 'internalTransfer', label: 'Transfer internal diabaikan', value: (summary?.internalTransferIn || 0) + (summary?.internalTransferOut || 0), className: 'text-muted' }
      : null,
    { key: 'expense', label: 'Pengeluaran bersih', value: -(summary?.expense || 0), className: 'text-expense' },
    { key: 'net', label: 'Selisih bersih', value: summary?.net || 0, className: (summary?.net || 0) >= 0 ? 'text-income' : 'text-expense' },
  ].filter(Boolean)

  return (
    <div className="rounded-[24px] border border-border bg-bg/70 p-4">
      <div className="mb-3">
        <p className="text-sm font-bold text-text">{title}</p>
        {note && <p className="mt-1 text-xs font-medium leading-relaxed text-muted">{note}</p>}
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-3 rounded-2xl bg-surface px-3.5 py-3">
            <span className="text-xs font-semibold leading-relaxed text-text-2">{row.label}</span>
            <span className={`shrink-0 text-sm font-black tabular-nums ${row.className}`}>
              {row.value > 0 ? '+' : ''}
              {fmt(row.value)}
            </span>
          </div>
        ))}
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

export function InteractiveDonut({
  data,
  categoryResolver = getExpenseDistributionCategory,
  emptyText = 'Belum ada pengeluaran',
  centerLabel = 'Total',
  netAdjustment = 0,
}) {
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
    let tAll = 0

    data.forEach(t => {
      const mainCat = categoryResolver(t)
      const subCat = t.sub_cat || 'Lain-lain'

      if (!m[mainCat]) m[mainCat] = { total: 0, subs: {} }
      m[mainCat].total += t.amount
      m[mainCat].subs[subCat] = (m[mainCat].subs[subCat] || 0) + t.amount
      tAll += t.amount
    })

    const effectiveTotal = Math.max(0, tAll - Math.max(0, netAdjustment))
    const ratio = tAll > 0 ? effectiveTotal / tAll : 1

    const grouped = Object.entries(m)
      .sort((a,b) => b[1].total - a[1].total)
      .map(([main, d]) => ({
        main,
        total: d.total * ratio,
        subs: Object.entries(d.subs)
          .sort((a,b) => b[1] - a[1])
          .map(([subName, subVal]) => [subName, subVal * ratio])
      }))

    const donut = grouped.map((g, i) => ({
      name: g.main,
      value: g.total,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }))

    return { donutD: donut, groupedOut: grouped, totalAll: effectiveTotal }
  }, [data, categoryResolver, netAdjustment])

  if (!donutD.length) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center opacity-50 min-h-[250px]">
        <PieChartIcon size={48} className="text-muted2 mb-3" strokeWidth={1}/>
        <p className="text-sm font-medium">{emptyText}</p>
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
            <span className="text-[10px] text-muted2 font-bold uppercase tracking-widest text-center">{centerLabel}</span>
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
