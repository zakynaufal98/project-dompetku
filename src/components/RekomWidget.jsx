import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { fmtShort, getCashflowMainCategory, isCashflowExpenseTx, summarizeFinancialTx } from '../lib/utils'
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  PieChart,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Landmark,
  Wallet,
} from 'lucide-react'

function buildRecommendations(txData, billData, budgetData) {
  const now = new Date()
  const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last3 = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const monthTx = txData.filter((t) => t.date?.startsWith(currYM))
  const summary = summarizeFinancialTx(monthTx)
  const roomAmount = summary.realIncome - summary.expense
  const roomRate = summary.realIncome > 0 ? roomAmount / summary.realIncome : 0
  const bulanAktif = last3.filter((ym) => txData.some((t) => t.date?.startsWith(ym))).length

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const overdueBills = billData.filter((b) => {
    if (b.is_lunas) return false
    const due = new Date(b.jatuh_tempo)
    due.setHours(0, 0, 0, 0)
    return due < today
  })

  const categorySpend = {}
  monthTx
    .filter((t) => isCashflowExpenseTx(t))
    .forEach((t) => {
      const mainCat = getCashflowMainCategory(t)
      categorySpend[mainCat] = (categorySpend[mainCat] || 0) + t.amount
    })
  const topCat = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0]

  const overBudgets = budgetData.filter((b) => {
    const spent = monthTx
      .filter((t) => isCashflowExpenseTx(t) && getCashflowMainCategory(t) === b.category)
      .reduce((sum, t) => sum + t.amount, 0)
    return spent > b.amount
  })

  const items = []

  if (overdueBills.length > 0) {
    const totalOverdue = overdueBills.reduce((sum, b) => sum + Number(b.amount), 0)
    items.push({
      level: 'danger',
      icon: <AlertTriangle size={18} />,
      title: `${overdueBills.length} tagihan melewati jatuh tempo`,
      desc: `Total ${fmtShort(totalOverdue)} masih tertunda. Prioritaskan ini dulu supaya arus kas bulan depan tidak ikut sesak.`,
      action: 'Buka dashboard',
      link: '/',
    })
  }

  if (summary.realIncome === 0 && summary.expense > 0) {
    items.push({
      level: 'warning',
      icon: <Wallet size={18} />,
      title: 'Belum ada pemasukan riil bulan ini',
      desc: `Sudah ada pengeluaran ${fmtShort(summary.expense)}. Catat pemasukan utama kalau memang sudah masuk, supaya ringkasan bulan ini lebih pas.`,
      action: 'Cek transaksi',
      link: '/transaksi',
    })
  } else if (summary.expense > summary.realIncome) {
    items.push({
      level: 'danger',
      icon: <TrendingDown size={18} />,
      title: 'Pengeluaran bersih melebihi pemasukan riil',
      desc: `Defisit ${fmtShort(summary.expense - summary.realIncome)} bulan ini. Fokus dulu ke kategori terbesar sebelum menambah komitmen baru.`,
      action: 'Lihat laporan',
      link: '/laporan/bulanan',
    })
  } else if (summary.realIncome > 0 && roomRate < 0.1) {
    items.push({
      level: 'warning',
      icon: <TrendingDown size={18} />,
      title: 'Sisa uang bulan ini tipis',
      desc: topCat
        ? `Sisa dari pemasukan riil kurang dari 10%. Pengeluaran terbesar masih di "${topCat[0]}" sebesar ${fmtShort(topCat[1])}.`
        : 'Sisa dari pemasukan riil kurang dari 10%. Coba tahan pengeluaran yang bisa ditunda.',
      action: 'Cek rincian',
      link: '/transaksi',
    })
  }

  if (overBudgets.length > 0) {
    items.push({
      level: 'warning',
      icon: <PieChart size={18} />,
      title: `${overBudgets.length} kategori melewati anggaran`,
      desc: `Yang perlu dilihat dulu: ${overBudgets.map((b) => b.category).join(', ')}.`,
      action: 'Tinjau anggaran',
      link: '/laporan/bulanan',
    })
  }

  if (summary.investmentLiquidation > 0) {
    items.push({
      level: 'info',
      icon: <Landmark size={18} />,
      title: 'Ada pencairan investasi bulan ini',
      desc: `${fmtShort(summary.investmentLiquidation)} masuk ke dompet, tapi dipisahkan dari pemasukan rutin.`,
      action: 'Lihat investasi',
      link: '/investasi',
    })
  }

  if (summary.investmentProfit > 0) {
    items.push({
      level: 'success',
      icon: <TrendingUp size={18} />,
      title: 'Investasi sedang untung',
      desc: `Profit investasi ${fmtShort(summary.investmentProfit)} tercatat sebagai hasil tambahan bulan ini.`,
      action: 'Buka investasi',
      link: '/investasi',
    })
  }

  if (bulanAktif < 2) {
    items.push({
      level: 'info',
      icon: <BookOpen size={18} />,
      title: 'Data bulan sebelumnya masih sedikit',
      desc: `Baru ada aktivitas di ${bulanAktif} dari 3 bulan terakhir. Ringkasan akan lebih berguna kalau pencatatannya makin rutin.`,
      action: 'Tambah transaksi',
      link: '/transaksi',
    })
  }

  if (budgetData.length === 0) {
    items.push({
      level: 'info',
      icon: <PieChart size={18} />,
      title: 'Belum ada anggaran kategori',
      desc: 'Batas kategori membantu membedakan mana pengeluaran yang sehat dan mana yang mulai melebar.',
      action: 'Atur anggaran',
      link: '/laporan/bulanan',
    })
  }

  if (items.length === 0) {
    items.push({
      level: 'success',
      icon: <CheckCircle2 size={18} />,
      title: 'Bulan ini terlihat aman',
      desc: summary.realIncome > 0
        ? `Pemasukan riil masih lebih besar ${fmtShort(roomAmount)} dari pengeluaran bersih. Pertahankan ritmenya.`
        : 'Belum ada sinyal yang perlu dikhawatirkan dari data bulan ini.',
      action: null,
    })
  }

  if (summary.realIncome > 0 && roomRate >= 0.2 && !items.some((item) => item.level === 'danger')) {
    items.push({
      level: 'success',
      icon: <Sparkles size={18} />,
      title: `Sisa uang ${Math.round(roomRate * 100)}% masih aman`,
      desc: 'Kondisi ini cukup sehat untuk menabung atau menambah alokasi investasi secara bertahap.',
      action: 'Cek investasi',
      link: '/investasi',
    })
  }

  return items
}

const LEVEL = {
  danger: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    label: 'Segera',
  },
  warning: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    label: 'Perhatian',
  },
  info: {
    border: 'border-l-indigo-500',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
    badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    label: 'Konteks',
  },
  success: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    label: 'Bagus',
  },
}

export default function RekomWidget() {
  const { txData, billData, budgetData } = useData()
  const items = useMemo(() => buildRecommendations(txData, billData, budgetData), [txData, billData, budgetData])

  const dangerCount = items.filter((item) => item.level === 'danger').length
  const warningCount = items.filter((item) => item.level === 'warning').length

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Lightbulb size={18} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-text">Catatan Untukmu</h2>
          <p className="text-[10px] text-muted font-medium">Dari pemasukan, pengeluaran, tagihan, dan anggaran bulan ini</p>
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

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, i) => {
          const style = LEVEL[item.level]
          return (
            <div key={i} className={`flex gap-4 p-4 rounded-2xl bg-bg border border-border border-l-4 ${style.border} hover:border-border2 transition-colors`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg} ${style.iconColor}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-sm font-bold text-text leading-tight mb-1">{item.title}</p>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                {item.action && (
                  <Link to={item.link} className={`inline-flex items-center gap-1 mt-2 text-[11px] font-bold ${style.iconColor} hover:underline`}>
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
