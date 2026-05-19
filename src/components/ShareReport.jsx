import { useMemo, useRef, useState } from 'react'
import {
  Share2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Target,
  CalendarDays,
  BarChart3,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmtShort, MONTHS_FULL, summarizeFinancialTx, isCashflowExpenseTx } from '../lib/utils'

const slideMeta = [
  { key: 'overview', label: 'Ringkasan' },
  { key: 'cashflow', label: 'Arus Kas' },
  { key: 'habits', label: 'Kebiasaan' },
  { key: 'balance', label: 'Posisi Akhir' },
]

export default function ShareReport() {
  const { txData, invData, totals } = useData()
  const reportRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [mode, setMode] = useState('bulanan')

  const stats = useMemo(() => {
    const now = new Date()
    const currYear = now.getFullYear()
    const currYM = `${currYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastYMDate = new Date(currYear, now.getMonth() - 1, 1)
    const lastYM = `${lastYMDate.getFullYear()}-${String(lastYMDate.getMonth() + 1).padStart(2, '0')}`

    const periodPrefix = mode === 'tahunan' ? String(currYear) : currYM
    const lastPeriodPrefix = mode === 'tahunan' ? String(currYear - 1) : lastYM
    const periodLabel = mode === 'tahunan' ? `Tahun ${currYear}` : `${MONTHS_FULL[now.getMonth()]} ${currYear}`

    const periodTx = txData.filter((t) => t.date?.startsWith(periodPrefix))
    const expenses = periodTx.filter((t) => isCashflowExpenseTx(t))
    const periodSummary = summarizeFinancialTx(periodTx)
    const totalOut = periodSummary.expense
    const totalIn = periodSummary.income
    const netto = totalIn - totalOut

    const lastSummary = summarizeFinancialTx(txData.filter((t) => t.date?.startsWith(lastPeriodPrefix)))
    const lastOut = lastSummary.expense
    const lastIn = lastSummary.income

    const outChange = lastOut > 0 ? ((totalOut - lastOut) / lastOut) * 100 : 0
    const inChange = lastIn > 0 ? ((totalIn - lastIn) / lastIn) * 100 : 0

    const catMap = {}
    expenses.forEach((t) => {
      catMap[t.cat] = (catMap[t.cat] || 0) + t.amount
    })
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)
    const topCat = topCats[0]?.[0] || 'Belum ada kategori'

    const invTotal = invData.filter((t) => t.action === 'beli' && t.date?.startsWith(periodPrefix)).reduce((s, t) => s + t.amount, 0)
    const savingsRate = totalIn > 0 ? Math.max(0, (netto / totalIn) * 100) : 0

    let title = 'Arus kas cukup stabil'
    if (Number(savingsRate) >= 30) title = 'Ruang nabungmu lagi bagus'
    else if (totalOut > totalIn && totalIn > 0) title = 'Pengeluaran lagi lebih agresif'
    else if (topCat === 'Konsumsi & Makan') title = 'Belanja makan sedang dominan'

    return {
      totalOut,
      totalIn,
      netto,
      topCat,
      topCats,
      freq: expenses.length,
      title,
      periodLabel,
      outChange,
      inChange,
      invTotal,
      savingsRate,
      endingBalance: totals.saldo,
      lastPeriodLabel: mode === 'tahunan' ? `${currYear - 1}` : MONTHS_FULL[lastYMDate.getMonth()],
    }
  }, [txData, invData, totals.saldo, mode])

  const changeTone = (value, inverse = false) => {
    const positive = value >= 0
    if (inverse) return positive ? 'text-expense' : 'text-income'
    return positive ? 'text-income' : 'text-expense'
  }

  const handleShare = async () => {
    if (!reportRef.current) return
    setIsCapturing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#f7f8f5',
      })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `cashflowku-wrapped-${mode}-${activeSlide + 1}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `CashFlowKu Wrapped ${stats.periodLabel}`,
          text: `Ringkasan ${stats.periodLabel}`,
        })
      } else {
        const link = document.createElement('a')
        link.download = `cashflowku-wrapped-${mode}-${activeSlide + 1}.png`
        link.href = dataUrl
        link.click()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsCapturing(false)
    }
  }

  const slides = [
    <div key="overview" className="flex h-full w-full flex-col justify-between bg-[#f7f8f5] p-7 text-[#101211]">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c847c]">CashFlowKu Wrapped</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">{stats.periodLabel}</h3>
          </div>
          <div className="rounded-full bg-[#dff3c8] px-3 py-1 text-[11px] font-bold text-[#1d2d17]">
            {slideMeta[0].label}
          </div>
        </div>
        <div className="rounded-[28px] border border-[#d9ddd6] bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#7c847c]">Catatan utama</p>
          <p className="mt-2 text-2xl font-black leading-tight text-[#101211]">{stats.title}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-[28px] bg-[#101211] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Pengeluaran</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{fmtShort(stats.totalOut)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Pemasukan</p>
            <p className="mt-2 text-lg font-black tabular-nums text-income">{fmtShort(stats.totalIn)}</p>
          </div>
          <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Netto</p>
            <p className={`mt-2 text-lg font-black tabular-nums ${stats.netto >= 0 ? 'text-income' : 'text-expense'}`}>{fmtShort(stats.netto)}</p>
          </div>
        </div>
      </div>
    </div>,

    <div key="cashflow" className="flex h-full w-full flex-col justify-between bg-[#f7f8f5] p-7 text-[#101211]">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c847c]">Perbandingan</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">Arus Kas</h3>
          </div>
          <div className="rounded-full bg-[#dff3c8] px-3 py-1 text-[11px] font-bold text-[#1d2d17]">
            {slideMeta[1].label}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Pemasukan</p>
                <p className="mt-2 text-2xl font-black text-income tabular-nums">+{fmtShort(stats.totalIn)}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${changeTone(stats.inChange)}`}>
                <TrendingUp size={14} className={stats.inChange < 0 ? 'rotate-180' : ''} />
                {Math.abs(stats.inChange).toFixed(0)}%
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[#7c847c]">dibanding {stats.lastPeriodLabel}</p>
          </div>
          <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Pengeluaran</p>
                <p className="mt-2 text-2xl font-black text-expense tabular-nums">-{fmtShort(stats.totalOut)}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${changeTone(stats.outChange, true)}`}>
                <TrendingDown size={14} className={stats.outChange < 0 ? 'rotate-180' : ''} />
                {Math.abs(stats.outChange).toFixed(0)}%
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-[#7c847c]">dibanding {stats.lastPeriodLabel}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[28px] bg-[#eaf0e7] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Kesimpulan</p>
        <p className="mt-2 text-lg font-black leading-snug text-[#101211]">
          {stats.netto >= 0 ? 'Uang masuk masih lebih besar dari uang keluar.' : 'Arus kas sedang negatif dan perlu dijaga.'}
        </p>
      </div>
    </div>,

    <div key="habits" className="flex h-full w-full flex-col justify-between bg-[#f7f8f5] p-7 text-[#101211]">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c847c]">Perilaku</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">Kebiasaan Belanja</h3>
          </div>
          <div className="rounded-full bg-[#dff3c8] px-3 py-1 text-[11px] font-bold text-[#1d2d17]">
            {slideMeta[2].label}
          </div>
        </div>
        <div className="rounded-[28px] border border-[#d9ddd6] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Kategori utama</p>
          <p className="mt-2 text-2xl font-black leading-tight text-[#101211]">{stats.topCat}</p>
          <p className="mt-2 text-sm font-medium text-[#7c847c]">{stats.freq} transaksi tercatat pada periode ini</p>
        </div>
      </div>
      <div className="space-y-3">
        {stats.topCats.slice(0, 3).map(([cat, val], index) => (
          <div key={cat} className="flex items-center justify-between rounded-[22px] border border-[#d9ddd6] bg-white px-4 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">#{index + 1}</p>
              <p className="mt-1 text-sm font-black text-[#101211]">{cat}</p>
            </div>
            <p className="text-sm font-black tabular-nums text-expense">{fmtShort(val)}</p>
          </div>
        ))}
        {stats.topCats.length === 0 && (
          <div className="rounded-[22px] border border-[#d9ddd6] bg-white px-4 py-6 text-sm font-medium text-[#7c847c]">
            Belum ada pengeluaran di periode ini.
          </div>
        )}
      </div>
    </div>,

    <div key="balance" className="flex h-full w-full flex-col justify-between bg-[#f7f8f5] p-7 text-[#101211]">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c847c]">Posisi akhir</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">Saldo & Tabungan</h3>
          </div>
          <div className="rounded-full bg-[#dff3c8] px-3 py-1 text-[11px] font-bold text-[#1d2d17]">
            {slideMeta[3].label}
          </div>
        </div>
        <div className="rounded-[28px] bg-[#101211] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Saldo akhir</p>
          <p className="mt-2 text-4xl font-black tabular-nums">{fmtShort(stats.endingBalance)}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Savings rate</p>
          <p className="mt-2 text-3xl font-black text-income tabular-nums">{stats.savingsRate.toFixed(0)}%</p>
          <p className="mt-2 text-sm font-medium text-[#7c847c]">dari pemasukan berhasil kamu sisakan</p>
        </div>
        {stats.invTotal > 0 && (
          <div className="rounded-[24px] border border-[#d9ddd6] bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7c847c]">Investasi dibeli</p>
            <p className="mt-2 text-2xl font-black text-income tabular-nums">{fmtShort(stats.invTotal)}</p>
          </div>
        )}
      </div>
    </div>,
  ]

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" aria-labelledby="wrapped-title">
      <div className="rounded-[28px] border border-border bg-bg p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="wrapped-title" className="text-2xl font-black tracking-tight text-text">
              CashFlowKu Wrapped
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Ringkasan shareable untuk periode pilihanmu. Dari web, tombol bagikan akan membuka share sheet perangkat jika browser mendukungnya.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-surface p-1">
            <button
              onClick={() => {
                setMode('bulanan')
                setActiveSlide(0)
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === 'bulanan' ? 'bg-primary text-text' : 'text-muted hover:text-text'}`}
            >
              <CalendarDays size={14} /> Bulanan
            </button>
            <button
              onClick={() => {
                setMode('tahunan')
                setActiveSlide(0)
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === 'tahunan' ? 'bg-primary text-text' : 'text-muted hover:text-text'}`}
            >
              <BarChart3 size={14} /> Tahunan
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-muted"><Wallet size={15} /><span className="text-xs font-bold uppercase tracking-[0.14em]">Netto</span></div>
            <p className={`mt-3 text-xl font-black tabular-nums ${stats.netto >= 0 ? 'text-income' : 'text-expense'}`}>{fmtShort(stats.netto)}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-muted"><Target size={15} /><span className="text-xs font-bold uppercase tracking-[0.14em]">Kategori utama</span></div>
            <p className="mt-3 line-clamp-2 text-base font-black text-text">{stats.topCat}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-muted"><Share2 size={15} /><span className="text-xs font-bold uppercase tracking-[0.14em]">Share</span></div>
            <p className="mt-3 text-sm font-medium text-text">Paling aman dibagikan lewat share sheet perangkat.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {slideMeta.map((slide, index) => (
            <button
              key={slide.key}
              onClick={() => setActiveSlide(index)}
              className={`rounded-full px-3 py-2 text-sm font-bold transition-colors ${activeSlide === index ? 'bg-text text-white' : 'bg-surface text-muted hover:text-text'}`}
            >
              {slide.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative" role="region" aria-label="Preview wrapped">
          <button
            onClick={() => setActiveSlide((s) => (s === 0 ? slides.length - 1 : s - 1))}
            className="absolute -left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm transition-transform hover:scale-105"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setActiveSlide((s) => (s === slides.length - 1 ? 0 : s + 1))}
            className="absolute -right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm transition-transform hover:scale-105"
            aria-label="Slide berikutnya"
          >
            <ChevronRight size={18} />
          </button>

          <div className="w-[280px] overflow-hidden rounded-[32px] border-[8px] border-white shadow-2xl" style={{ aspectRatio: '9 / 16' }}>
            <div ref={reportRef} className="h-full w-full" aria-hidden="true">
              {slides[activeSlide]}
            </div>
          </div>
        </div>

        <div className="flex gap-2" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2 rounded-full transition-all ${activeSlide === i ? 'w-6 bg-text' : 'w-2 bg-border hover:bg-muted'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleShare}
          disabled={isCapturing}
          className="btn-primary w-full justify-center px-6 py-3"
          aria-label={`Bagikan ${slideMeta[activeSlide].label}`}
        >
          {isCapturing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          {isCapturing ? 'Menyiapkan gambar...' : `Bagikan ${slideMeta[activeSlide].label}`}
        </button>

        <p className="max-w-[280px] text-center text-[11px] font-medium text-muted">
          Web app tidak bisa memaksa langsung ke Instagram Story. Di mobile yang mendukung, tombol ini akan membuka share sheet sehingga kamu bisa lanjut memilih aplikasi tujuan.
        </p>
      </div>
    </section>
  )
}
