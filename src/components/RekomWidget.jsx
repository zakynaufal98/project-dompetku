import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { fmtShort } from '../lib/utils'
import {
  Lightbulb, TrendingDown, TrendingUp, BookOpen,
  AlertTriangle, PieChart, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react'

function buildRekom(txData, billData, budgetData) {
  const now    = new Date()
  const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last3  = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const monthIn  = txData.filter(t => t.type === 'in'  && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
  const monthOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
  const savingsRate = monthIn > 0 ? Math.max(0, (monthIn - monthOut) / monthIn) : 0

  const bulanAktif = last3.filter(ym => txData.some(t => t.date?.startsWith(ym))).length

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const overdueBills = billData.filter(b => {
    if (b.is_lunas) return false
    const due = new Date(b.jatuh_tempo)
    due.setHours(0, 0, 0, 0)
    return due < today
  })

  const catSpend = {}
  txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM))
    .forEach(t => { catSpend[t.cat] = (catSpend[t.cat] || 0) + t.amount })
  const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]

  const overBudgets = budgetData.filter(b => {
    const spent = txData.filter(t => t.type === 'out' && t.cat === b.category && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    return spent > b.amount
  })

  const items = []

  if (overdueBills.length > 0) {
    const totalOverdue = overdueBills.reduce((s, b) => s + Number(b.amount), 0)
    items.push({
      level: 'danger',
      icon: <AlertTriangle size={18} />,
      title: `${overdueBills.length} tagihan melewati jatuh tempo`,
      desc: `Total ${fmtShort(totalOverdue)} belum dibayar. Segera selesaikan agar skor tidak turun.`,
      action: 'Bayar di Dashboard',
      link: '/',
    })
  }

  if (overBudgets.length > 0) {
    items.push({
      level: 'warning',
      icon: <TrendingDown size={18} />,
      title: `${overBudgets.length} kategori melebihi anggaran`,
      desc: `Kategori ${overBudgets.map(b => b.category).join(', ')} sudah melampaui batas bulan ini.`,
      action: 'Tinjau Anggaran',
      link: '/laporan/bulanan',
    })
  }

  if (monthIn > 0 && monthOut > monthIn) {
    items.push({
      level: 'danger',
      icon: <AlertTriangle size={18} />,
      title: 'Pengeluaran melebihi pemasukan',
      desc: `Defisit ${fmtShort(monthOut - monthIn)}. Cari pos pengeluaran yang bisa dipangkas.`,
      action: 'Cek Transaksi',
      link: '/transaksi',
    })
  }

  if (monthIn > 0 && savingsRate < 0.1 && monthOut <= monthIn) {
    items.push({
      level: 'warning',
      icon: <TrendingDown size={18} />,
      title: 'Rasio tabungan terlalu rendah',
      desc: topCat
        ? `Pengeluaran terbesar di "${topCat[0]}" (${fmtShort(topCat[1])}). Coba kurangi di sana.`
        : 'Pengeluaran hampir menyamai pemasukan. Cari pos yang bisa dikurangi.',
      action: 'Lihat Laporan',
      link: '/laporan/bulanan',
    })
  }

  if (bulanAktif < 2) {
    items.push({
      level: 'info',
      icon: <BookOpen size={18} />,
      title: 'Konsistensi mencatat perlu ditingkatkan',
      desc: `Aktif di ${bulanAktif} dari 3 bulan terakhir. Data lengkap membuat analisis lebih akurat.`,
      action: 'Tambah Transaksi',
      link: '/transaksi',
    })
  }

  if (budgetData.length === 0) {
    items.push({
      level: 'info',
      icon: <PieChart size={18} />,
      title: 'Belum ada anggaran bulanan',
      desc: 'Atur batas pengeluaran per kategori untuk kendali keuangan yang lebih baik.',
      action: 'Atur Anggaran',
      link: '/laporan/bulanan',
    })
  }

  if (items.length === 0) {
    items.push({
      level: 'success',
      icon: <CheckCircle2 size={18} />,
      title: 'Kondisi keuangan sangat baik!',
      desc: savingsRate >= 0.2
        ? `Rasio tabungan ${Math.round(savingsRate * 100)}% — jauh di atas rata-rata. Pertimbangkan investasikan kelebihannya.`
        : 'Semua indikator dalam kondisi baik. Pertahankan kebiasaan finansial yang sehat.',
      action: null,
    })
  }

  if (savingsRate >= 0.2 && items.length > 0 && !items.some(i => i.level === 'danger')) {
    items.push({
      level: 'success',
      icon: <TrendingUp size={18} />,
      title: `Tabungan ${Math.round(savingsRate * 100)}% — pertahankan!`,
      desc: 'Kamu menyisihkan lebih dari 20% pemasukan. Alokasikan ke investasi untuk hasil optimal.',
      action: 'Lihat Investasi',
      link: '/investasi',
    })
  }

  return items
}

const LEVEL = {
  danger:  { border: 'border-l-red-500',    iconBg: 'bg-red-500/10',    iconColor: 'text-red-500',    badge: 'bg-red-500/10 text-red-500 border-red-500/20',    label: 'Segera' },
  warning: { border: 'border-l-amber-500',  iconBg: 'bg-amber-500/10',  iconColor: 'text-amber-500',  badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Perhatian' },
  info:    { border: 'border-l-indigo-500', iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'Tips' },
  success: { border: 'border-l-emerald-500',iconBg: 'bg-emerald-500/10',iconColor: 'text-emerald-500',badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Bagus' },
}

export default function RekomWidget() {
  const { txData, billData, budgetData } = useData()
  const items = useMemo(() => buildRekom(txData, billData, budgetData), [txData, billData, budgetData])

  const dangerCount  = items.filter(i => i.level === 'danger').length
  const warningCount = items.filter(i => i.level === 'warning').length

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Lightbulb size={18} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-text">Rekomendasi Untukmu</h2>
          <p className="text-[10px] text-muted font-medium">Berdasarkan data keuangan bulan ini</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {dangerCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {dangerCount} segera
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {warningCount} perhatian
            </span>
          )}
          {dangerCount === 0 && warningCount === 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} /> Semua oke
            </span>
          )}
        </div>
      </div>

      {/* Grid items */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, i) => {
          const s = LEVEL[item.level]
          return (
            <div key={i} className={`flex gap-4 p-4 rounded-2xl bg-bg border border-border border-l-4 ${s.border} hover:border-border2 transition-colors`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.iconBg} ${s.iconColor}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${s.badge}`}>
                    {s.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-text leading-tight mb-1">{item.title}</p>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                {item.action && (
                  <Link to={item.link} className={`inline-flex items-center gap-1 mt-2 text-[11px] font-bold ${s.iconColor} hover:underline`}>
                    {item.action} <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
