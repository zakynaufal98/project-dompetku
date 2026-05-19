import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmtShort, getCashflowMainCategory, isCashflowExpenseTx, summarizeFinancialTx } from '../lib/utils'
import { ShieldCheck, Wallet, BookOpen, Receipt, PieChart, Landmark } from 'lucide-react'

function calcScore(txData, billData, budgetData) {
  const now = new Date()
  const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const last3 = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const monthTx = txData.filter((t) => t.date?.startsWith(currYM))
  const summary = summarizeFinancialTx(monthTx)
  const roomAmount = Math.max(0, summary.realIncome - summary.expense)
  const roomRate = summary.realIncome > 0 ? roomAmount / summary.realIncome : monthTx.length === 0 ? 1 : 0
  const roomScore = Math.min(40, Math.round(roomRate * 200))
  const roomPct = Math.round(roomRate * 100)

  const bulanAktif = last3.filter((ym) => txData.some((t) => t.date?.startsWith(ym))).length
  const catatScore = Math.round((bulanAktif / 3) * 30)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = billData.filter((b) => {
    if (b.is_lunas) return false
    const due = new Date(b.jatuh_tempo)
    due.setHours(0, 0, 0, 0)
    return due < today
  }).length
  const tagihanScore = Math.max(0, 20 - Math.min(overdue, 4) * 5)

  let anggaranScore = 0
  if (budgetData.length > 0) {
    const over = budgetData.filter((b) => {
      const spent = monthTx
        .filter((t) => isCashflowExpenseTx(t) && getCashflowMainCategory(t) === b.category)
        .reduce((sum, t) => sum + t.amount, 0)
      return spent > b.amount
    }).length
    anggaranScore = Math.max(0, 10 - over * 3)
  }

  return {
    total: Math.min(100, roomScore + catatScore + tagihanScore + anggaranScore),
    roomScore,
    roomPct,
    roomAmount,
    catatScore,
    bulanAktif,
    tagihanScore,
    overdue,
    anggaranScore,
    punyaAnggaran: budgetData.length > 0,
    summary,
  }
}

function getTheme(score) {
  if (score >= 80) return { gradient: 'from-emerald-500 to-teal-500', color: '#10B981', label: 'Sangat Sehat' }
  if (score >= 60) return { gradient: 'from-indigo-500 to-violet-500', color: '#4F46E5', label: 'Cukup Sehat' }
  if (score >= 40) return { gradient: 'from-amber-500 to-orange-500', color: '#F59E0B', label: 'Perlu Perhatian' }
  return { gradient: 'from-red-500 to-rose-500', color: '#EF4444', label: 'Butuh Perbaikan' }
}

function Gauge({ score }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const fill = arc * (score / 100)
  const { label } = getTheme(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="10"
            strokeDasharray={`${arc} ${circ - arc}`}
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="10"
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 pointer-events-none">
          <span className="text-5xl font-black tabular-nums leading-none text-white drop-shadow">{score}</span>
          <span className="text-[11px] font-bold text-white/70 mt-0.5">dari 100</span>
        </div>
      </div>
      <span className="text-sm font-black mt-1 tracking-wide text-white drop-shadow">{label}</span>
    </div>
  )
}

function ScoreRow({ icon, label, pct, color, info }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-bg rounded-2xl border border-border hover:border-border2 transition-colors">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-text truncate">{label}</span>
          <span className="text-xs font-black tabular-nums ml-2 flex-shrink-0" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
          />
        </div>
        <p className="text-[10px] text-muted mt-1 leading-relaxed">{info}</p>
      </div>
    </div>
  )
}

export default function HealthScoreWidget() {
  const { txData, billData, budgetData } = useData()
  const score = useMemo(() => calcScore(txData, billData, budgetData), [txData, billData, budgetData])
  const theme = getTheme(score.total)

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className={`bg-gradient-to-br ${theme.gradient} p-7 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="relative z-10 mb-5 flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-white" />
          <div>
            <h2 className="text-sm font-bold text-white">Skor Keuangan</h2>
            <p className="mt-1 max-w-sm text-[11px] font-medium leading-relaxed text-white/70">
              Dari pemasukan, pengeluaran, tagihan, dan anggaran. Transfer antar dompet dipisahkan.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex justify-center">
          <Gauge score={score.total} />
        </div>

        {(score.summary.investmentLiquidation > 0 || score.summary.investmentProfit > 0) && (
          <div className="relative z-10 mt-5 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-white/85">
            <div className="flex items-start gap-2">
              <Landmark size={16} className="mt-0.5 shrink-0" />
              <div className="space-y-1 text-[11px] font-medium leading-relaxed">
                {score.summary.investmentLiquidation > 0 && (
                  <p>Pencairan investasi {fmtShort(score.summary.investmentLiquidation)} dipisahkan dari pemasukan rutin.</p>
                )}
                {score.summary.investmentProfit > 0 && (
                  <p>Profit investasi {fmtShort(score.summary.investmentProfit)} tetap terlihat sebagai hasil tambahan, bukan pendapatan utama.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-2.5 flex-1">
        <ScoreRow
          icon={<Wallet size={15} />}
          label="Sisa dari pemasukan"
          pct={Math.round((score.roomScore / 40) * 100)}
          color="#10B981"
          info={
            score.summary.realIncome > 0
              ? `Pengeluaran masih menyisakan ${score.roomPct}% atau ${fmtShort(score.roomAmount)} dari pemasukan bulan ini`
              : 'Belum ada pemasukan bulan ini'
          }
        />
        <ScoreRow
          icon={<BookOpen size={15} />}
          label="Konsistensi pencatatan"
          pct={Math.round((score.catatScore / 30) * 100)}
          color="#4F46E5"
          info={`Ada aktivitas di ${score.bulanAktif} dari 3 bulan terakhir`}
        />
        <ScoreRow
          icon={<Receipt size={15} />}
          label="Kondisi tagihan"
          pct={Math.round((score.tagihanScore / 20) * 100)}
          color="#F59E0B"
          info={score.overdue === 0 ? 'Tidak ada tagihan yang melewati jatuh tempo' : `${score.overdue} tagihan melewati jatuh tempo`}
        />
        <ScoreRow
          icon={<PieChart size={15} />}
          label="Batas anggaran"
          pct={Math.round((score.anggaranScore / 10) * 100)}
          color="#8B5CF6"
          info={!score.punyaAnggaran ? 'Belum ada anggaran, jadi faktor ini belum bisa dinilai penuh' : 'Dibandingkan dengan batas kategori yang sudah kamu tetapkan'}
        />
      </div>
    </div>
  )
}
