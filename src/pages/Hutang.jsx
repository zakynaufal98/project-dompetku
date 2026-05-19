import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today } from '../lib/utils'
import { TxItem, PanelHeader, Empty, Field } from '../components/UI'
import {
  Landmark, CheckCircle2, ReceiptText, PlusCircle, Loader2,
  Wallet, ChevronDown, ListChecks, HandCoins, ChevronRight, X, Pencil, Sparkles
} from 'lucide-react'

const makeHutangTag  = (id) => `#HID-${String(id).slice(-6)}`
const makePiutangTag = (id) => `#PID-${String(id).slice(-6)}`

// Ambil nama kontak dari format "NamaKontak: keterangan"
const parseName = (desc) => {
  if (!desc) return null
  const i = desc.indexOf(':')
  if (i > 0 && i <= 30) return desc.substring(0, i).trim()
  return null
}

export default function Hutang() {
  const { txData, addTx, updateTx, deleteTx, walletData, totals } = useData()

  const [pageTab, setPageTab]               = useState('hutang')   // 'hutang' | 'piutang'
  const [mode, setMode]                     = useState('bayar')     // hutang: bayar|pinjam / piutang: terima|beri
  const [nama, setNama]                     = useState('')
  const [amount, setAmount]                 = useState('')
  const [desc, setDesc]                     = useState('')
  const [date, setDate]                     = useState(today())
  const [walletId, setWalletId]             = useState('')
  const [selectedId, setSelectedId]         = useState('')
  const [autoTag, setAutoTag]               = useState('') // tag #HID/PID hidden dari user
  const [expandedGroups, setExpandedGroups] = useState({})
  const [busy, setBusy]                     = useState(false)
  const [err, setErr]                       = useState('')

  // ── Edit modal state ──────────────────────────────────────
  const [editTx, setEditTx]           = useState(null)
  const [editDesc, setEditDesc]       = useState('')
  const [editAmount, setEditAmount]   = useState('')
  const [editDate, setEditDate]       = useState('')
  const [editWalletId, setEditWalletId] = useState('')
  const [editBusy, setEditBusy]       = useState(false)
  const [editErr, setEditErr]         = useState('')

  useEffect(() => {
    if (walletData?.length > 0 && !walletId) setWalletId(walletData[0].id)
  }, [walletData, walletId])

  // Reset form saat ganti tab
  useEffect(() => {
    setMode(pageTab === 'hutang' ? 'bayar' : 'terima')
    setNama(''); setDesc(''); setAmount(''); setSelectedId(''); setAutoTag(''); setErr('')
  }, [pageTab])

  // ─── HUTANG DATA ────────────────────────────────────────
  const hutangMasuk = useMemo(() => txData.filter(t =>
    (t.type === 'in' && t.cat === 'Pinjaman') ||
    (t.type === 'in' && t.cat === 'Transfer' && t.sub_cat === 'Terima Pinjaman')
  ), [txData])
  const totalHutang  = hutangMasuk.reduce((s, t) => s + t.amount, 0)

  const cicilanKeluar = useMemo(() => txData.filter(t =>
    (t.type === 'out' && (t.cat === 'Bayar Cicilan' || t.cat === 'Kewajiban')) ||
    (t.type === 'out' && t.cat === 'Transfer' && t.sub_cat === 'Bayar Pinjaman')
  ), [txData])

  const sisaPerHutang = useMemo(() => hutangMasuk.map(h => {
    const tag = makeHutangTag(h.id)
    let terbayar = cicilanKeluar.filter(c => c.desc?.includes(tag)).reduce((s, c) => s + c.amount, 0)
    if (terbayar === 0) {
      terbayar = cicilanKeluar
        .filter(c => {
          if (c.desc?.match(/#HID-[a-z0-9]{6}/i)) return false
          return c.desc?.replace(/^Cicilan:\s*/i, '').trim().toLowerCase() === h.desc?.trim().toLowerCase()
        })
        .reduce((s, c) => s + c.amount, 0)
    }
    return { ...h, sisa: Math.max(0, h.amount - terbayar) }
  }), [hutangMasuk, cicilanKeluar])
  const activeHutang   = sisaPerHutang.filter(h => h.sisa > 0)
  const sisaHutang     = sisaPerHutang.reduce((s, h) => s + h.sisa, 0)
  const totalDibayar   = totalHutang - sisaHutang
  const progressHutang = totalHutang === 0 ? 0 : Math.min(100, (totalDibayar / totalHutang) * 100)

  const hutangGrouped = useMemo(() => {
    const groups = {}
    sisaPerHutang.forEach(h => {
      const person = parseName(h.desc) || h.desc || 'Lainnya'
      if (!groups[person]) groups[person] = { items: [], totalSisa: 0, totalAmount: 0 }
      groups[person].items.push(h)
      groups[person].totalSisa  += h.sisa
      groups[person].totalAmount += h.amount
    })
    return Object.entries(groups).sort((a, b) => b[1].totalSisa - a[1].totalSisa)
  }, [sisaPerHutang])

  const riwayatHutang = useMemo(() =>
    [...hutangMasuk, ...cicilanKeluar].sort((a, b) =>
      new Date(b.date) - new Date(a.date) || new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ), [hutangMasuk, cicilanKeluar])

  // ─── PIUTANG DATA ────────────────────────────────────────
  const piutangKeluar = useMemo(() => txData.filter(t =>
    t.type === 'out' && t.cat === 'Piutang' && t.sub_cat === 'Beri Pinjaman'
  ), [txData])
  const totalPiutang = piutangKeluar.reduce((s, t) => s + t.amount, 0)

  const pelunasanMasuk = useMemo(() => txData.filter(t =>
    t.type === 'in' && t.cat === 'Piutang' && t.sub_cat === 'Terima Pelunasan'
  ), [txData])

  const sisaPerPiutang = useMemo(() => piutangKeluar.map(p => {
    const tag = makePiutangTag(p.id)
    let diterima = pelunasanMasuk.filter(r => r.desc?.includes(tag)).reduce((s, c) => s + c.amount, 0)
    if (diterima === 0) {
      diterima = pelunasanMasuk
        .filter(r => {
          if (r.desc?.match(/#PID-[a-z0-9]{6}/i)) return false
          return r.desc?.replace(/^Pelunasan:\s*/i, '').trim().toLowerCase() === p.desc?.trim().toLowerCase()
        })
        .reduce((s, c) => s + c.amount, 0)
    }
    return { ...p, sisa: Math.max(0, p.amount - diterima) }
  }), [piutangKeluar, pelunasanMasuk])
  const activePiutang    = sisaPerPiutang.filter(p => p.sisa > 0)
  const sisaPiutang      = sisaPerPiutang.reduce((s, p) => s + p.sisa, 0)
  const totalDiterima    = totalPiutang - sisaPiutang
  const progressPiutang  = totalPiutang === 0 ? 0 : Math.min(100, (totalDiterima / totalPiutang) * 100)

  const piutangGrouped = useMemo(() => {
    const groups = {}
    sisaPerPiutang.forEach(p => {
      const person = parseName(p.desc) || p.desc || 'Lainnya'
      if (!groups[person]) groups[person] = { items: [], totalSisa: 0, totalAmount: 0 }
      groups[person].items.push(p)
      groups[person].totalSisa   += p.sisa
      groups[person].totalAmount += p.amount
    })
    return Object.entries(groups).sort((a, b) => b[1].totalSisa - a[1].totalSisa)
  }, [sisaPerPiutang])

  const riwayatPiutang = useMemo(() =>
    [...piutangKeluar, ...pelunasanMasuk].sort((a, b) =>
      new Date(b.date) - new Date(a.date) || new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ), [piutangKeluar, pelunasanMasuk])

  // ─── DERIVED VALUES ──────────────────────────────────────
  const isHutang    = pageTab === 'hutang'
  const isBayarMode = mode === 'bayar' || mode === 'terima'
  const currentActive  = isHutang ? activeHutang  : activePiutang
  const currentGrouped = isHutang ? hutangGrouped  : piutangGrouped
  const currentRiwayat = isHutang ? riwayatHutang  : riwayatPiutang
  const totalMain   = isHutang ? totalHutang  : totalPiutang
  const totalPaid   = isHutang ? totalDibayar : totalDiterima
  const sisaMain    = isHutang ? sisaHutang   : sisaPiutang
  const progressMain = isHutang ? progressHutang : progressPiutang
  const activeWallet = totals?.walletBalances?.find(w => w.id === walletId)

  // ─── HANDLERS ────────────────────────────────────────────
  const handleSelectEntry = (id) => {
    setSelectedId(id)
    if (isHutang) {
      const found = activeHutang.find(h => h.id === id)
      if (found) {
        setDesc(`Cicilan: ${found.desc}`)
        setAutoTag(makeHutangTag(found.id))
      }
    } else {
      const found = activePiutang.find(p => p.id === id)
      if (found) {
        setDesc(`Pelunasan: ${found.desc}`)
        setAutoTag(makePiutangTag(found.id))
      }
    }
  }

  const handleSimpan = async () => {
    if (!desc.trim() && !nama.trim()) { setErr('Keterangan atau nama wajib diisi'); return }
    if (!amount || +amount <= 0)      { setErr('Jumlah harus lebih dari 0'); return }
    if (!walletId)                    { setErr('Sumber dana wajib dipilih'); return }

    setBusy(true); setErr('')

    let finalDesc = desc.trim()
    // Sisipkan tag matching secara otomatis (tidak ditampilkan ke user)
    if (autoTag && !finalDesc.includes(autoTag)) finalDesc = `${finalDesc} ${autoTag}`
    if (nama.trim() && !finalDesc.startsWith('Cicilan:') && !finalDesc.startsWith('Pelunasan:')) {
      finalDesc = finalDesc ? `${nama.trim()}: ${finalDesc}` : nama.trim()
    }

    let type, cat, sub_cat
    if (isHutang) {
      type    = isBayarMode ? 'out' : 'in'
      cat     = 'Transfer'
      sub_cat = isBayarMode ? 'Bayar Pinjaman' : 'Terima Pinjaman'
    } else {
      type    = isBayarMode ? 'in' : 'out'
      cat     = 'Piutang'
      sub_cat = isBayarMode ? 'Terima Pelunasan' : 'Beri Pinjaman'
    }

    const e = await addTx({ desc: finalDesc || nama.trim(), amount: +amount, type, cat, sub_cat, date, wallet_id: walletId })
    setBusy(false)
    if (e) setErr(e.message)
    else { setDesc(''); setAmount(''); setNama(''); setSelectedId(''); setAutoTag('') }
  }

  const toggleGroup = (key) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const handleOpenEdit = (t) => {
    setEditTx(t)
    setEditDesc(t.desc || '')
    setEditAmount(String(t.amount))
    setEditDate(t.date || today())
    setEditWalletId(t.wallet_id || walletData?.[0]?.id || '')
    setEditErr('')
  }

  const handleCloseEdit = () => { setEditTx(null); setEditErr('') }

  const handleSaveEdit = async () => {
    if (!editDesc.trim())             { setEditErr('Keterangan wajib diisi'); return }
    if (!editAmount || +editAmount <= 0) { setEditErr('Jumlah harus lebih dari 0'); return }

    setEditBusy(true); setEditErr('')
    const e = await updateTx(editTx.id, {
      desc:      editDesc.trim(),
      amount:    +editAmount,
      type:      editTx.type,
      cat:       editTx.cat,
      sub_cat:   editTx.sub_cat,
      date:      editDate,
      wallet_id: editWalletId || null,
    })
    setEditBusy(false)
    if (e) setEditErr(e.message)
    else handleCloseEdit()
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      <header className="relative flex flex-col gap-5 rounded-[28px] bg-text p-7 text-white md:flex-row md:items-center md:justify-between md:p-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]" aria-hidden="true">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(208,50,56,0.35)' }} />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full blur-3xl" style={{ background: 'rgba(255,209,26,0.2)' }} />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 md:flex">
            <Landmark size={22} className="text-white" />
          </div>
          <div>
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <Sparkles size={10} /> Manajemen Hutang
            </div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Hutang & Piutang</h1>
            <p className="mt-1.5 max-w-md text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Pantau kewajiban dan tagihan piutangmu.
            </p>
          </div>
        </div>
      </header>

      {/* Page-level tabs */}
      <div className="flex gap-2 bg-surface border border-border rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setPageTab('hutang')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            isHutang ? 'bg-expense-light text-expense shadow-sm' : 'text-muted hover:text-text'
          }`}
        >
          Hutang
        </button>
        <button
          onClick={() => setPageTab('piutang')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            !isHutang ? 'bg-income-light text-income shadow-sm' : 'text-muted hover:text-text'
          }`}
        >
          <HandCoins size={15} /> Piutang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── KOLOM KIRI: STATS + FORM ─────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">

          {/* Stats card */}
          <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
              isHutang ? 'bg-expense-light text-expense' : 'bg-income-light text-income'
            }`}>
              {isHutang ? <Landmark size={24} strokeWidth={2.5} /> : <HandCoins size={24} strokeWidth={2.5} />}
            </div>
            <p className="text-muted font-bold text-sm uppercase tracking-wider mb-1">
              {isHutang ? 'Sisa Kewajiban' : 'Sisa Piutang'}
            </p>
            <h2 className="text-3xl font-black text-text tabular-nums tracking-tight">{fmt(sisaMain)}</h2>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-income">
                  {isHutang ? 'Telah dibayar' : 'Diterima kembali'}: {fmtShort(totalPaid)}
                </span>
                <span className="text-muted2">Total: {fmtShort(totalMain)}</span>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-income rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressMain}%` }}
                />
              </div>
              {progressMain >= 100 && totalMain > 0 && (
                <p className="text-invest text-xs font-bold flex items-center gap-1.5 mt-3 animate-fade-in">
                  <CheckCircle2 size={14} />
                  {isHutang ? 'Hutang telah lunas!' : 'Semua piutang telah kembali!'}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
            <div className="flex gap-2 p-1 bg-border rounded-xl mb-5">
              <button
                onClick={() => { setMode(isHutang ? 'bayar' : 'terima'); setErr(''); setSelectedId('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  isBayarMode ? 'bg-surface text-gold shadow-sm' : 'text-muted hover:text-text-2'
                }`}
              >
                {isHutang ? 'Bayar Cicilan' : 'Terima Pelunasan'}
              </button>
              <button
                onClick={() => { setMode(isHutang ? 'pinjam' : 'beri'); setErr(''); setSelectedId('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  !isBayarMode ? 'bg-surface text-income shadow-sm' : 'text-muted hover:text-text-2'
                }`}
              >
                {isHutang ? 'Tambah Hutang' : 'Beri Pinjaman'}
              </button>
            </div>

            <div className="space-y-4">

              {/* Pilih hutang/piutang saat mode bayar/terima */}
              {isBayarMode && currentActive.length > 0 && (
                <Field label={<span className="flex items-center gap-1.5"><ListChecks size={13} /> {isHutang ? 'Hutang yang Dibayar' : 'Piutang yang Dilunasi'}</span>}>
                  <div className="relative">
                    <select
                      className="form-input pr-10 py-3 cursor-pointer appearance-none font-semibold text-text-2 w-full"
                      value={selectedId}
                      onChange={e => handleSelectEntry(e.target.value)}
                    >
                      <option value="">— Pilih... —</option>
                      {currentActive.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.desc} · sisa {fmtShort(h.sisa)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </Field>
              )}

              {/* Nama kontak — hanya saat tambah baru */}
              {!isBayarMode && (
                <Field label={isHutang ? 'Nama Pemberi Hutang (Opsional)' : 'Nama Peminjam'}>
                  <input
                    type="text"
                    value={nama}
                    onChange={e => setNama(e.target.value)}
                    placeholder={isHutang ? 'Mis: Bank BCA, Om Budi...' : 'Mis: Andi, Bu Sari...'}
                    className="w-full bg-field border border-border rounded-xl py-3 px-4 focus:border-income text-sm text-text placeholder:text-muted2 outline-none"
                  />
                </Field>
              )}

              <Field label="Keterangan">
                <input
                  type="text"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={
                    isBayarMode && isHutang ? 'Mis: Cicilan Motor Bulan 3' :
                    isBayarMode            ? 'Mis: Pelunasan dari Andi' :
                    isHutang               ? 'Mis: Kredit motor, KPR...' :
                                             'Mis: Modal usaha, keperluan...'
                  }
                  className="w-full bg-field border border-border rounded-xl py-3 px-4 focus:border-income text-sm text-text placeholder:text-muted2 outline-none"
                />
              </Field>

              <Field label="Jumlah (Rp)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''}
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-field border border-border rounded-xl py-3 px-4 focus:border-income text-sm text-text placeholder:text-muted2 outline-none font-medium tabular-nums"
                />
              </Field>

              <Field label={
                isHutang
                  ? (isBayarMode ? 'Gunakan Dana Dari' : 'Terima Uang Ke')
                  : (isBayarMode ? 'Terima Uang Ke'   : 'Dana Dari Dompet')
              }>
                {totals?.walletBalances?.length > 0 ? (
                  <div className="relative">
                    <div
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white"
                      style={{ backgroundColor: activeWallet?.color || '#94a3b8' }}
                    >
                      <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <select
                      className="form-input pl-14 pr-10 py-3 cursor-pointer appearance-none relative z-0 font-semibold text-text-2 w-full"
                      value={walletId}
                      onChange={e => setWalletId(e.target.value)}
                    >
                      <option value="" disabled>Pilih Dompet...</option>
                      {totals.walletBalances.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.calculatedBalance < 0 ? '-' : ''}Rp {Math.abs(w.calculatedBalance).toLocaleString('id-ID')}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-bg border border-border rounded-xl px-4 py-3 text-sm text-muted flex items-center gap-2">
                    <Wallet size={16} className="text-slate-400" /> Belum ada dompet. Buat di Dashboard!
                  </div>
                )}
              </Field>

              <Field label="Tanggal">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full min-w-0 bg-field border border-border rounded-xl py-3 px-4 focus:border-income text-sm outline-none cursor-pointer text-text-2"
                />
              </Field>

              {err && <div className="text-xs text-expense font-medium">{err}</div>}

              <button
                onClick={handleSimpan}
                disabled={busy}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer active:scale-95 ${
                  isBayarMode ? 'bg-gold hover:bg-orange-600' :
                  isHutang    ? 'bg-income hover:bg-emerald-600' : 'bg-invest hover:opacity-90'
                }`}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                {isHutang
                  ? (isBayarMode ? 'Catat Pembayaran'    : 'Catat Hutang Baru')
                  : (isBayarMode ? 'Catat Pelunasan'     : 'Catat Pinjaman Keluar')}
              </button>
            </div>
          </div>
        </div>

        {/* ── KOLOM KANAN: GROUPED LIST + RIWAYAT ─────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Grouped by person */}
          {currentGrouped.length > 0 && (
            <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
              <PanelHeader
                title={isHutang ? 'Hutang per Kontak' : 'Piutang per Peminjam'}
                sub={isHutang ? 'Kewajiban' : 'Tagihan'}
                badge={`${currentGrouped.length} kontak`}
              />
              <div className="mt-4 space-y-2">
                {currentGrouped.map(([person, group]) => {
                  const isExpanded = !!expandedGroups[person]
                  const isLunas    = group.totalSisa === 0
                  return (
                    <div
                      key={person}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isLunas ? 'border-border opacity-60' : 'border-border2'
                      }`}
                    >
                      <button
                        onClick={() => toggleGroup(person)}
                        className="w-full flex items-center justify-between px-4 py-3.5 bg-bg hover:bg-border/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 text-left min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isLunas  ? 'bg-income-light text-income' :
                            isHutang ? 'bg-expense-light text-expense' : 'bg-invest-light text-invest'
                          }`}>
                            {person.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-text truncate">{person}</p>
                            <p className="text-[10px] text-muted font-semibold">
                              {group.items.length} entri · Total {fmtShort(group.totalAmount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-sm font-black tabular-nums ${
                            isLunas  ? 'text-income' :
                            isHutang ? 'text-expense' : 'text-invest'
                          }`}>
                            {isLunas ? 'Lunas' : fmtShort(group.totalSisa)}
                          </span>
                          <ChevronRight
                            size={16}
                            className={`text-muted2 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-surface px-4 py-3 space-y-2">
                          {group.items.map(h => (
                            <div
                              key={h.id}
                              className="flex items-center justify-between py-2 border-b border-border last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-text truncate">{h.desc}</p>
                                <p className="text-[10px] text-muted">
                                  {fmtShort(h.amount)} · sisa {fmtShort(h.sisa)}
                                </p>
                              </div>
                              {h.sisa === 0 && (
                                <CheckCircle2 size={14} className="text-income shrink-0 ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Riwayat */}
          <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
            <PanelHeader
              title={isHutang ? 'Riwayat Cicilan & Pinjaman' : 'Riwayat Pinjaman & Pelunasan'}
              sub="Histori"
              badge={`${currentRiwayat.length} aktivitas`}
            />
            <div className="mt-6 lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {currentRiwayat.length > 0 ? (
                <div className="space-y-2">
                  {currentRiwayat.map(t => (
                    <TxItem
                      key={`${isHutang ? 'h' : 'p'}-${t.id}`}
                      t={t}
                      onDelete={deleteTx}
                      onEdit={handleOpenEdit}
                      walletName={walletData?.find(w => w.id === t.wallet_id)?.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10">
                  <Empty
                    icon={<ReceiptText size={40} className="text-muted2 mb-3" strokeWidth={1} />}
                    text={isHutang
                      ? 'Belum ada riwayat hutang atau cicilan'
                      : 'Belum ada riwayat piutang atau pelunasan'}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── EDIT MODAL ──────────────────────────────────────── */}
      {editTx && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-surface w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] border border-border shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="font-bold text-text text-base flex items-center gap-2">
                  <Pencil size={16} className="text-primary" /> Edit Catatan
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {editTx.cat === 'Piutang' ? 'Piutang' : 'Hutang'} ·{' '}
                  <span className={editTx.type === 'in' ? 'text-income' : 'text-expense'}>
                    {editTx.sub_cat}
                  </span>
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-bg text-muted2 hover:text-expense transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">

              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Keterangan</label>
                <input
                  className="form-input py-2.5 w-full"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Jumlah (Rp)</label>
                <input
                  className="form-input py-2.5 w-full tabular-nums"
                  type="text"
                  inputMode="numeric"
                  value={editAmount ? Number(editAmount).toLocaleString('id-ID') : ''}
                  onChange={e => setEditAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                />
              </div>

              {totals?.walletBalances?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-muted ml-1 block mb-1">Dompet</label>
                  <div className="relative">
                    <div
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white"
                      style={{ backgroundColor: totals.walletBalances.find(w => w.id === editWalletId)?.color || '#94a3b8' }}
                    >
                      <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <select
                      className="form-input pl-14 pr-10 py-2.5 cursor-pointer appearance-none font-semibold text-text-2 w-full"
                      value={editWalletId}
                      onChange={e => setEditWalletId(e.target.value)}
                    >
                      <option value="">— Tanpa dompet —</option>
                      {totals.walletBalances.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={15} />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted ml-1 block mb-1">Tanggal</label>
                <input
                  type="date"
                  className="form-input py-2.5 w-full min-w-0"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>

              {editErr && (
                <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">
                  {editErr}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <button
                onClick={handleSaveEdit}
                disabled={editBusy}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {editBusy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
