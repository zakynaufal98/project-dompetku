import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { fmt, fmtShort, MONTHS } from '../lib/utils'
import { Spinner, InteractiveDonut } from '../components/UI'
import { Target, TrendingUp, TrendingDown, Users, ArrowLeft, Wallet, ArrowDownCircle, ArrowUpCircle, CalendarDays } from 'lucide-react'
import BillTracker from '../components/BillTracker'
import WalletWidget from '../components/WalletWidget'
import SharedAccount from '../components/SharedAccount'
import ShareReport from '../components/ShareReport'
import QuickAdd from '../components/QuickAdd'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border2 rounded-xl p-3 text-xs shadow-lg pointer-events-none transition-colors">
      <p className="text-muted font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-text">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { txData, invData, targetData, loading, totals, addWallet, updateWallet, deleteWallet, sharedOwners, activeOwnerId, switchAccount, isViewingShared, activeSharedRole } = useData() 
  const { user } = useAuth()
  const now = new Date()
  
  const { currIn, currOut, trends } = useMemo(() => {
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYM = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

    const cIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)

    const lIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)

    const cInReal = cIn + invData.filter(t => t.action === 'jual' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOutReal = cOut + invData.filter(t => t.action === 'beli' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    
    const currSaldo = totals.saldo
    const lastSaldo = currSaldo - cInReal + cOutReal

    const calcPct = (curr, last) => {
      if (last === 0) return curr > 0 ? 100 : 0
      return ((curr - last) / last) * 100
    }

    return {
      currIn: cIn,
      currOut: cOut,
      trends: { saldo: calcPct(currSaldo, lastSaldo), masuk: calcPct(cIn, lIn), keluar: calcPct(cOut, lOut) }
    }
  }, [txData, invData, totals.saldo, now])

  const todayOut = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
  }, [txData, now]);

  const tren6 = useMemo(() => Array.from({length: 6}, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    
    const inTx = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0)
    const outTx = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0)

    return { name: MONTHS[d.getMonth()], Pemasukan: inTx, Pengeluaran: outTx }
  }), [txData, now]) 

  const targetSummary = useMemo(() => {
    const rows = targetData
      .map((target) => {
        const amount = Number(target.amount) || 0
        const saved = Number(target.saved) || 0
        return {
          ...target, amount, saved, remaining: Math.max(0, amount - saved),
          progress: amount > 0 ? Math.min(100, Math.max(0, (saved / amount) * 100)) : 0,
        }
      })
      .sort((a, b) => a.remaining - b.remaining)

    return {
      rows: rows.slice(0, 3),
      totalRemaining: rows.reduce((sum, target) => sum + target.remaining, 0),
      avgProgress: rows.length ? rows.reduce((sum, target) => sum + target.progress, 0) / rows.length : 0,
    }
  }, [targetData])

  // 👇 Data transaksi bulan ini khusus disiapkan untuk Interactive Donut 👇
  const currYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const txBlnOut = useMemo(() => {
    return txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && t.date?.startsWith(currYM));
  }, [txData, currYM]);

  const renderTrendBadge = (pct, isExpense = false) => {
    if (pct === 0) return <span className="text-muted2 bg-bg px-2 py-1 rounded-md font-bold text-[11px] tracking-wide">0%</span>
    const isPositive = pct > 0
    const isGood = isExpense ? !isPositive : isPositive 
    const colorClass = isGood ? 'text-invest bg-invest-light' : 'text-expense bg-expense-light'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`${colorClass} flex items-center font-bold px-2 py-1 rounded-md text-[11px] tracking-wide`}>
        <Icon size={14} className="mr-1 stroke-[3px]" />{isPositive ? '+' : ''}{pct.toFixed(1)}%
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

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Pengguna'

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      {/* SHARED ACCOUNT BANNER */}
      {isViewingShared && (
        <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-indigo-500" />
            <div>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Melihat data milik: <span className="underline">{sharedOwners.find(s => s.owner_id === activeOwnerId)?.owner_email}</span></p>
              <p className="text-[10px] font-bold text-indigo-400">Mode: {activeSharedRole === 'editor' ? 'Editor (bisa edit)' : 'Viewer (hanya lihat)'}</p>
            </div>
          </div>
          <button onClick={() => switchAccount(null)} className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors">
            <ArrowLeft size={14} /> Kembali ke akun saya
          </button>
        </div>
      )}

      {/* ACCOUNT SWITCHER */}
      {!isViewingShared && sharedOwners.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest flex-shrink-0">Akun:</span>
          <button onClick={() => switchAccount(null)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-income text-white shadow-sm flex-shrink-0">
            Milik Saya
          </button>
          {sharedOwners.map(s => (
            <button key={s.id} onClick={() => switchAccount(s.owner_id)} className="px-3 py-1.5 rounded-full text-xs font-bold bg-surface border border-border2 text-text-2 hover:border-income/30 transition-colors flex-shrink-0">
              {s.owner_email}
            </button>
          ))}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="font-black text-2xl text-text tracking-tight leading-tight">
            {displayName} <span className="text-2xl">👋</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CalendarDays size={12} className="text-muted" />
            <p className="text-muted text-xs font-medium">{todayLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted font-medium hidden sm:block">Net bulan ini:</span>
          <span className={`font-black text-sm tabular-nums px-3 py-1.5 rounded-xl ${(currIn - currOut) >= 0 ? 'bg-income/10 text-income' : 'bg-expense-light text-expense'}`}>
            {(currIn - currOut) >= 0 ? '+' : ''}{fmtShort(currIn - currOut)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo */}
        <div className="bg-surface border border-border rounded-[22px] p-5 flex flex-col gap-4 transition-colors hover:shadow-card-md hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Wallet size={18} style={{ color: '#6366f1' }} />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-1">Saldo Saat Ini</p>
            <p className="tabular-nums font-black text-[22px] text-text tracking-tight leading-none">{fmt(totals.saldo)}</p>
            <div className="flex items-center gap-2 mt-2.5">
              {renderTrendBadge(trends.saldo, false)}
              <span className="text-muted text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Keluar Hari Ini */}
        <div className="rounded-[22px] p-5 flex flex-col gap-4 text-white hover:-translate-y-0.5 duration-200 transition-transform relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#fff' }} />
          <div className="flex items-center justify-between relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarDays size={18} className="text-white" />
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">Hari Ini</span>
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-indigo-200 mb-1">Keluar Hari Ini</p>
            <p className="tabular-nums font-black text-[22px] tracking-tight leading-none">
              {todayOut > 0 ? `-${fmt(todayOut)}` : 'Rp 0'}
            </p>
            <p className="mt-2.5 text-[11px] font-semibold text-indigo-100">
              {todayOut === 0 ? '✨ Belum ada pengeluaran' : '👀 Pantau terus dompetmu!'}
            </p>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-surface border border-border rounded-[22px] p-5 flex flex-col gap-4 transition-colors hover:shadow-card-md hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.1)' }}>
              <ArrowDownCircle size={18} style={{ color: '#FF8A00' }} />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Bulan Ini</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-1">Pengeluaran</p>
            <p className="tabular-nums font-black text-[22px] tracking-tight leading-none" style={{ color: '#FF8A00' }}>
              {currOut > 0 ? `-${fmt(currOut)}` : fmt(currOut)}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              {renderTrendBadge(trends.keluar, true)}
              <span className="text-muted text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* Pemasukan */}
        <div className="bg-surface border border-border rounded-[22px] p-5 flex flex-col gap-4 transition-colors hover:shadow-card-md hover:-translate-y-0.5 duration-200">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.1)' }}>
              <ArrowUpCircle size={18} style={{ color: '#10B981' }} />
            </div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Bulan Ini</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-1">Pemasukan</p>
            <p className="tabular-nums font-black text-[22px] tracking-tight leading-none" style={{ color: '#10B981' }}>
              {currIn > 0 ? `+${fmt(currIn)}` : fmt(currIn)}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              {renderTrendBadge(trends.masuk, false)}
              <span className="text-muted text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>
      </div>

      <WalletWidget totals={totals} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={deleteWallet} />

      {/* Grafik + Tagihan + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-surface border border-border rounded-2xl p-5 lg:col-span-2 flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Grafik</p>
              <h2 className="font-black text-base text-text tracking-tight">Tren Keuangan</h2>
            </div>
            <span className="text-[10px] font-bold text-muted bg-bg border border-border px-2.5 py-1.5 rounded-lg uppercase tracking-widest">
              6 Bulan
            </span>
          </div>
          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren6} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF8A00" stopOpacity={0.2}/><stop offset="95%" stopColor="#FF8A00" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                <YAxis width={75} tickFormatter={fmtShort} tick={{fontSize:11, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#FF8A00" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-2"><div className="w-3 h-3 rounded-full bg-income" />Pemasukan</div>
            <div className="flex items-center gap-2 text-xs font-semibold text-text-2"><div className="w-3 h-3 rounded-full bg-gold" />Pengeluaran</div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <BillTracker />
          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col flex-1 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Kategori</p>
                <h2 className="font-black text-base text-text tracking-tight">Distribusi</h2>
              </div>
              <span className="text-[10px] font-bold text-muted bg-bg border border-border px-2.5 py-1.5 rounded-lg uppercase tracking-widest">Bln Ini</span>
            </div>
            <InteractiveDonut data={txBlnOut} />
          </div>
        </div>
      </div>

      {/* Target Finansial */}
      <div className="bg-surface border border-border rounded-2xl p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
              <Target size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5">Progres</p>
              <h2 className="font-black text-base text-text tracking-tight">Target Finansial</h2>
              <p className="text-xs font-medium text-muted mt-0.5">
                {targetData.length} aktif · sisa {fmtShort(targetSummary.totalRemaining)}
              </p>
            </div>
          </div>
          <Link to="/target" className="btn-secondary px-4 py-2 text-sm">Kelola Target</Link>
        </div>
        {targetSummary.rows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {targetSummary.rows.map((target) => (
              <Link key={target.id} to="/target" className="bg-bg border border-border rounded-2xl p-4 hover:border-income/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-text text-sm line-clamp-1">{target.name}</p>
                    <p className="text-xs font-medium text-muted mt-0.5">Sisa {fmtShort(target.remaining)}</p>
                  </div>
                  <span className="text-[11px] font-black text-income tabular-nums flex-shrink-0">{Math.round(target.progress)}%</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-income rounded-full transition-all" style={{ width: `${target.progress}%` }} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-bg rounded-2xl p-4 text-sm font-medium text-muted">
            Belum ada target. Buat target seperti dana darurat atau liburan agar progresnya tampil di sini.
          </div>
        )}
      </div>

      {/* Quick Add FAB */}
      <QuickAdd />

      {/* Shared Account — di bawah, kontekstual */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SharedAccount />
        <ShareReport />
      </div>

    </div>
  )
}