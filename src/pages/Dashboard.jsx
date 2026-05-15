import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { fmt, fmtShort, MONTHS, isCashflowIncomeTx, isCashflowExpenseTx, isInternalTransferTx, summarizeFinancialTx } from '../lib/utils'
import { Spinner, InteractiveDonut, BreakdownPanel } from '../components/UI'
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowLeft,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronDown,
  Share2,
} from 'lucide-react'
import BillTracker from '../components/BillTracker'
import WalletWidget from '../components/WalletWidget'
import SharedAccount from '../components/SharedAccount'
import ShareReport from '../components/ShareReport'
import QuickAdd from '../components/QuickAdd'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pointer-events-none rounded-xl border border-border2 bg-surface p-3 text-xs shadow-lg transition-colors">
      <p className="mb-1 font-semibold text-muted">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const {
    txData,
    invData,
    targetData,
    loading,
    totals,
    addWallet,
    updateWallet,
    deleteWallet,
    sharedOwners,
    activeOwnerId,
    switchAccount,
    isViewingShared,
    activeSharedRole,
  } = useData()
  const { user } = useAuth()
  const now = new Date()
  const [showWrapped, setShowWrapped] = useState(false)
  const [showCalcDetails, setShowCalcDetails] = useState(false)

  const openingBalance = useMemo(
    () => (totals?.walletBalances || []).reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0),
    [totals?.walletBalances]
  )

  const currentMonthSummary = useMemo(() => {
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return summarizeFinancialTx(txData.filter((t) => t.date?.startsWith(currYM)))
  }, [txData, now])

  const { currIn, currOut, movementNet, trends } = useMemo(() => {
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYM = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

    const currentMonth = summarizeFinancialTx(txData.filter((t) => t.date?.startsWith(currYM)))
    const lastMonth = summarizeFinancialTx(txData.filter((t) => t.date?.startsWith(lastYM)))

    const currSaldo = totals.saldo
    const lastSaldo = currSaldo - currentMonth.realIncome - currentMonth.investmentProfit + currentMonth.expense

    const calcPct = (curr, last) => {
      if (last === 0) return curr > 0 ? 100 : 0
      return ((curr - last) / last) * 100
    }

    return {
      currIn: currentMonth.realIncome,
      currOut: currentMonth.expense,
      movementNet: currentMonth.realIncome + currentMonth.investmentProfit - currentMonth.expense,
      trends: {
        saldo: calcPct(currSaldo, lastSaldo),
        masuk: calcPct(currentMonth.realIncome, lastMonth.realIncome),
        keluar: calcPct(currentMonth.expense, lastMonth.expense),
      },
    }
  }, [txData, totals.saldo, now])

  const todayOut = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return txData.filter((t) => t.type === 'out' && t.date === todayStr && !isInternalTransferTx(t)).reduce((s, t) => s + t.amount, 0)
  }, [txData, now])

  const tren6 = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const summary = summarizeFinancialTx(txData.filter((t) => t.date?.startsWith(key)))
        return { name: MONTHS[d.getMonth()], Pemasukan: summary.realIncome, Pengeluaran: summary.expense }
      }),
    [txData, now]
  )

  const targetSummary = useMemo(() => {
    const rows = targetData
      .map((target) => {
        const amount = Number(target.amount) || 0
        const saved = Number(target.saved) || 0
        return {
          ...target,
          remaining: Math.max(0, amount - saved),
          progress: amount > 0 ? Math.min(100, Math.max(0, (saved / amount) * 100)) : 0,
        }
      })
      .sort((a, b) => a.remaining - b.remaining)

    return {
      rows: rows.slice(0, 2),
      totalRemaining: rows.reduce((sum, target) => sum + target.remaining, 0),
    }
  }, [targetData])

  const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const txBlnOut = useMemo(() => {
    return txData.filter((t) => t.type === 'out' && !isInternalTransferTx(t) && t.date?.startsWith(currYM))
  }, [txData, currYM])

  const extraMonthlyMovement = useMemo(() => {
    const monthTx = txData.filter((tx) => tx.date?.startsWith(currYM))

    const extraOut = monthTx
      .filter((tx) => tx.type === 'out' && !isInternalTransferTx(tx) && !isCashflowExpenseTx(tx))
      .reduce((sum, tx) => sum + tx.amount, 0)

    const extraIn = monthTx
      .filter((tx) => tx.type === 'in' && !isInternalTransferTx(tx) && !isCashflowIncomeTx(tx))
      .reduce((sum, tx) => sum + tx.amount, 0)

    return { extraOut, extraIn }
  }, [txData, currYM])

  const renderTrendBadge = (pct, isExpense = false) => {
    if (pct === 0) return <span className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-bold tracking-wide text-muted">0%</span>
    const isPositive = pct > 0
    const isGood = isExpense ? !isPositive : isPositive
    const colorClass = isGood ? 'text-invest bg-invest-light' : 'text-expense bg-expense-light'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`${colorClass} flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide`}>
        <Icon size={14} className="mr-1 stroke-[3px]" />
        {isPositive ? '+' : ''}
        {pct.toFixed(1)}%
      </span>
    )
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Selamat pagi'
    if (h < 15) return 'Selamat siang'
    if (h < 19) return 'Selamat sore'
    return 'Selamat malam'
  })()

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Pengguna'
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="mx-auto max-w-7xl animate-fade-up space-y-6 pb-10">
      {isViewingShared && (
        <div className="animate-fade-in flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                Melihat data milik: <span className="underline">{sharedOwners.find((s) => s.owner_id === activeOwnerId)?.owner_email}</span>
              </p>
              <p className="text-[10px] font-bold text-indigo-400">
                Mode: {activeSharedRole === 'editor' ? 'Editor (bisa edit)' : 'Viewer (hanya lihat)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => switchAccount(null)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-900"
          >
            <ArrowLeft size={14} /> Kembali ke akun saya
          </button>
        </div>
      )}

      {!isViewingShared && sharedOwners.length > 0 && (
        <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted">Akun:</span>
          <button onClick={() => switchAccount(null)} className="flex-shrink-0 rounded-full bg-income px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            Milik Saya
          </button>
          {sharedOwners.map((s) => (
            <button
              key={s.id}
              onClick={() => switchAccount(s.owner_id)}
              className="flex-shrink-0 rounded-full border border-border2 bg-surface px-3 py-1.5 text-xs font-bold text-text-2 transition-colors hover:border-income/30"
            >
              {s.owner_email}
            </button>
          ))}
        </div>
      )}

      <div className="page-band flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-text md:text-4xl">
            {greeting}, {displayName}
          </h1>
          <div className="mt-1.5 flex items-center gap-1.5">
            <CalendarDays size={12} className="text-muted" />
            <p className="text-xs font-medium text-muted">{todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden font-medium text-muted sm:block">Selisih bersih bulan ini:</span>
          <span className={`rounded-full px-4 py-2 text-sm font-black tabular-nums ${movementNet >= 0 ? 'bg-income-light text-income' : 'bg-expense-light text-expense'}`}>
            {movementNet >= 0 ? '+' : ''}
            {fmtShort(movementNet)}
          </span>
          <button
            onClick={() => setShowCalcDetails((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-2 text-[11px] font-bold text-text transition-colors hover:bg-bg"
            aria-expanded={showCalcDetails}
          >
            Lihat perhitungan
            <ChevronDown size={14} className={`transition-transform ${showCalcDetails ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {showCalcDetails && (
        <BreakdownPanel
          title="Cara dashboard menghitung bulan ini"
          note="Pemasukan riil dipisah dari pencairan dan profit investasi. Transfer antar dompet tetap diabaikan."
          summary={currentMonthSummary}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4 rounded-[22px] border border-border bg-surface p-5 transition-colors duration-200 hover:-translate-y-0.5 hover:shadow-card-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale text-text">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Saldo Saat Ini</p>
            <p className="text-[22px] font-black leading-none tracking-tight text-text tabular-nums">{fmt(totals.saldo)}</p>
            <p className="mt-2 text-[11px] font-medium text-muted">
              Termasuk saldo awal {fmtShort(openingBalance)}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              {renderTrendBadge(trends.saldo)}
              <span className="text-xs font-medium text-muted">vs bln lalu</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-border bg-primary-pale p-5 text-text transition-transform duration-200 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
              <CalendarDays size={18} className="text-text" />
            </div>
          </div>
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-text-2">Keluar Hari Ini</p>
            <p className="text-[22px] font-black leading-none tracking-tight text-text tabular-nums">
              {todayOut > 0 ? `-${fmt(todayOut)}` : 'Rp 0'}
            </p>
            <p className="mt-2.5 text-[11px] font-semibold text-text-2">
              {todayOut === 0 ? 'Belum ada pengeluaran' : 'Pantau arus kas harianmu'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[22px] border border-border bg-surface p-5 transition-colors duration-200 hover:-translate-y-0.5 hover:shadow-card-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense-light text-expense">
              <ArrowDownCircle size={18} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Pengeluaran Bersih</p>
            <p className="text-[22px] font-black leading-none tracking-tight text-expense tabular-nums">
              {currOut > 0 ? `-${fmt(currOut)}` : fmt(currOut)}
            </p>
            {(extraMonthlyMovement.extraOut > 0 || currentMonthSummary.investmentLiquidation > 0) && (
              <p className="mt-2 text-[11px] font-medium text-muted">
                {currentMonthSummary.investmentLiquidation > 0
                  ? `Pencairan investasi ${fmtShort(currentMonthSummary.investmentLiquidation)} ikut menekan pengeluaran bersih.`
                  : `Termasuk kewajiban atau alokasi ${fmtShort(extraMonthlyMovement.extraOut)}.`}
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              {renderTrendBadge(trends.keluar, true)}
              <span className="text-xs font-medium text-muted">vs bln lalu</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[22px] border border-border bg-surface p-5 transition-colors duration-200 hover:-translate-y-0.5 hover:shadow-card-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income-light text-income">
              <ArrowUpCircle size={18} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted">Pemasukan Riil</p>
            <p className="text-[22px] font-black leading-none tracking-tight text-income tabular-nums">
              {currIn > 0 ? `+${fmt(currIn)}` : fmt(currIn)}
            </p>
            {(currentMonthSummary.investmentProfit > 0 || extraMonthlyMovement.extraIn > 0) && (
              <p className="mt-2 text-[11px] font-medium text-muted">
                {currentMonthSummary.investmentProfit > 0
                  ? `Profit investasi ${fmtShort(currentMonthSummary.investmentProfit)} ditampilkan terpisah dari pemasukan riil.`
                  : `Pinjaman atau pencairan ${fmtShort(extraMonthlyMovement.extraIn)} tidak dihitung sebagai pemasukan.`}
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              {renderTrendBadge(trends.masuk)}
              <span className="text-xs font-medium text-muted">vs bln lalu</span>
            </div>
          </div>
        </div>
      </div>

      <WalletWidget totals={totals} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={deleteWallet} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 transition-colors lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight text-text">Tren Keuangan</h2>
              <p className="mt-1 text-xs font-medium text-muted">Pemasukan riil dan pengeluaran bersih 6 bulan terakhir.</p>
            </div>
            <span className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">6 Bulan</span>
          </div>
          <div className="min-h-[220px] w-full flex-1 rounded-[22px] border border-border/70 bg-bg/70 p-2 sm:min-h-[232px] sm:p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren6} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ead4b" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#2ead4b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d03238" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d03238" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d9ddd6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7c847c' }} axisLine={false} tickLine={false} dy={8} minTickGap={24} />
                <YAxis width={64} tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#7c847c' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#2ead4b" strokeWidth={2.75} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#d03238" strokeWidth={2.75} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-bg px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative w-7">
                  <span className="absolute left-0 top-1/2 h-[3px] w-7 -translate-y-1/2 rounded-full bg-income" />
                  <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-income" />
                </div>
                <span className="text-xs font-bold text-text">Pemasukan</span>
              </div>
              <span className="text-xs font-black tabular-nums text-income">{fmtShort(currIn)}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-bg px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative w-7">
                  <span className="absolute left-0 top-1/2 h-[3px] w-7 -translate-y-1/2 rounded-full bg-expense" />
                  <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-expense" />
                </div>
                <span className="text-xs font-bold text-text">Pengeluaran</span>
              </div>
              <span className="text-xs font-black tabular-nums text-expense">{fmtShort(currOut)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <BillTracker />
          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-5 transition-colors">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-text">Distribusi Pengeluaran Bersih</h2>
              <span className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">Bln Ini</span>
            </div>
            <p className="mb-3 text-xs font-medium leading-relaxed text-muted">
              Donut ini sekarang disesuaikan ke pengeluaran bersih, jadi arus masuk non-pendapatan seperti pinjaman masuk akan mengurangi total kategori secara proporsional.
            </p>
            <div className="rounded-[22px] border border-border/70 bg-bg/70 p-2">
              <InteractiveDonut data={txBlnOut} centerLabel="Peng. Bersih" netAdjustment={currentMonthSummary.excludedIn} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 transition-colors">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income-light text-income shadow-sm">
              <Target size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-text">Target Finansial</h2>
              <p className="mt-0.5 text-xs font-medium text-muted">
                {targetData.length} aktif, sisa {fmtShort(targetSummary.totalRemaining)}
              </p>
            </div>
          </div>
          <Link to="/target" className="btn-secondary px-4 py-2 text-sm">Lihat Semua</Link>
        </div>
        {targetSummary.rows.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {targetSummary.rows.map((target) => (
              <Link key={target.id} to="/target" className="rounded-2xl border border-border bg-bg p-4 transition-colors hover:border-income/30">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-bold text-text">{target.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-muted">Sisa {fmtShort(target.remaining)}</p>
                  </div>
                  <span className="flex-shrink-0 text-[11px] font-black tabular-nums text-income">{Math.round(target.progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-income transition-all" style={{ width: `${target.progress}%` }} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-bg p-4 text-sm font-medium text-muted">
            Belum ada target. Buat target seperti dana darurat atau liburan agar progresnya tampil di sini.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SharedAccount />
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale text-text">
                <Share2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-text">Wrapped & Share</h2>
                <p className="mt-0.5 text-xs font-medium text-muted">
                  Dibuka saat dibutuhkan, jadi dashboard tetap ringan dibaca.
                </p>
              </div>
            </div>
            <button onClick={() => setShowWrapped((prev) => !prev)} className="btn-secondary px-4 py-2 text-sm" aria-expanded={showWrapped}>
              {showWrapped ? 'Sembunyikan' : 'Buka Wrapped'}
              <ChevronDown size={14} className={`transition-transform ${showWrapped ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showWrapped && (
            <div className="mt-5">
              <ShareReport />
            </div>
          )}
        </div>
      </div>

      <QuickAdd />
    </div>
  )
}
