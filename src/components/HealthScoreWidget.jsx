import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { ShieldCheck, Info, TrendingUp, BookOpen, Receipt, PieChart } from 'lucide-react'

function calcScore(txData, billData, budgetData) {
  const now    = new Date()
  const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last3  = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const monthIn  = txData.filter(t => t.type === 'in'  && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
  const monthOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
  const rate     = monthIn > 0 ? Math.max(0, (monthIn - monthOut) / monthIn) : 0
  const tabunganScore = Math.min(40, Math.round(rate * 200))
  const tabunganPct   = Math.round(rate * 100)

  const bulanAktif = last3.filter(ym => txData.some(t => t.date?.startsWith(ym))).length
  const catatScore = Math.round((bulanAktif / 3) * 30)

  const now2    = new Date()
  const today2  = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate())
  const overdue = billData.filter(b => {
    if (b.is_lunas) return false
    const due = new Date(b.jatuh_tempo)
    due.setHours(0, 0, 0, 0)
    return due < today2
  }).length
  const tagihanScore = Math.max(0, 20 - Math.min(overdue, 4) * 5)

  let anggaranScore = 0  // 0 jika belum pernah atur anggaran
  if (budgetData.length > 0) {
    const over = budgetData.filter(b => {
      const spent = txData.filter(t => t.type === 'out' && t.cat === b.category && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
      return spent > b.amount
    }).length
    anggaranScore = Math.max(0, 10 - over * 3)
  }

  return {
    total: Math.min(100, tabunganScore + catatScore + tagihanScore + anggaranScore),
    tabunganScore, tabunganPct,
    catatScore, bulanAktif,
    tagihanScore, overdue,
    anggaranScore, punyaAnggaran: budgetData.length > 0,
  }
}

/* Gauge */
function Gauge({ score }) {
  const r = 54, circ = 2 * Math.PI * r
  const arc = circ * 0.75, fill = arc * (score / 100)
  const { color, label } =
    score >= 80 ? { color: '#10B981', label: 'Sangat Sehat' } :
    score >= 60 ? { color: '#4F46E5', label: 'Cukup Sehat' } :
    score >= 40 ? { color: '#F59E0B', label: 'Perlu Perhatian' } :
                  { color: '#EF4444', label: 'Butuh Perbaikan' }
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10"
            strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 pointer-events-none">
          <span className="text-4xl font-black tabular-nums leading-none" style={{ color }}>{score}</span>
          <span className="text-[11px] font-bold text-muted mt-0.5">dari 100</span>
        </div>
      </div>
      <span className="text-xs font-black mt-1 tracking-wide" style={{ color }}>{label}</span>
    </div>
  )
}

/* Bar baris — tampilkan persentase, bukan angka mentah */
function ScoreBar({ icon, label, pct, color, info, badge }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-text truncate">{label}</span>
          <span className="text-[11px] font-black tabular-nums ml-2 flex-shrink-0" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-bg rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }} />
        </div>
        <p className="text-[10px] text-muted mt-0.5">{info}</p>
      </div>
    </div>
  )
}

export default function HealthScoreWidget() {
  const { txData, billData, budgetData } = useData()
  const s = useMemo(() => calcScore(txData, billData, budgetData), [txData, billData, budgetData])

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-income" />
          <h2 className="font-bold text-sm text-text">Skor Kesehatan Keuangan</h2>
        </div>
        <div className="relative group">
          <Info size={14} className="text-muted cursor-help" />
          <div className="absolute right-0 top-6 w-56 bg-text text-bg text-[11px] rounded-xl p-3 hidden group-hover:block z-20 shadow-xl leading-relaxed">
            Skor 0–100 dari 4 faktor: tabungan, konsistensi mencatat, kondisi tagihan, dan anggaran.
          </div>
        </div>
      </div>

      {/* Gauge — center */}
      <div className="flex justify-center">
        <Gauge score={s.total} />
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* 4 Bar rows */}
      <div className="space-y-3">
        <ScoreBar
          icon={<TrendingUp size={14} />} label="Tabungan Bulan Ini"
          pct={Math.round((s.tabunganScore / 40) * 100)} color="#10B981"
          info={s.tabunganPct > 0
            ? `Pemasukan ${s.tabunganPct}% lebih besar dari pengeluaran`
            : 'Pengeluaran melebihi atau sama dengan pemasukan'}
        />
        <ScoreBar
          icon={<BookOpen size={14} />} label="Konsistensi Mencatat"
          pct={Math.round((s.catatScore / 30) * 100)} color="#4F46E5"
          info={`Mencatat di ${s.bulanAktif} dari 3 bulan terakhir`}
        />
        <ScoreBar
          icon={<Receipt size={14} />} label="Kondisi Tagihan"
          pct={Math.round((s.tagihanScore / 20) * 100)} color="#F59E0B"
          info={s.overdue === 0
            ? 'Tidak ada tagihan yang melewati jatuh tempo'
            : `${s.overdue} tagihan melewati jatuh tempo`}
        />
        <ScoreBar
          icon={<PieChart size={14} />} label="Kepatuhan Anggaran"
          pct={Math.round((s.anggaranScore / 10) * 100)} color="#8B5CF6"
          info={!s.punyaAnggaran
            ? 'Belum ada anggaran — atur di halaman Laporan'
            : 'Berdasarkan anggaran yang sudah kamu tetapkan'}
        />
      </div>
    </div>
  )
}
