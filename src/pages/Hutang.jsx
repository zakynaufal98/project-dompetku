import { useState, useMemo, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today } from '../lib/utils'
import { TxItem, PanelHeader, Empty, Field } from '../components/UI'
import { Landmark, CheckCircle2, ReceiptText, PlusCircle, Loader2, Wallet, ChevronDown } from 'lucide-react'

export default function Hutang() {
  // 👇 TAMBAHAN: Panggil walletData dan totals dari context
  const { txData, addTx, deleteTx, walletData, totals } = useData()
  
  const [mode, setMode] = useState('bayar') 
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(today())
  
  // 👇 TAMBAHAN: State untuk menyimpan Wallet ID
  const [walletId, setWalletId] = useState('') 
  
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // 👇 TAMBAHAN: Auto-select dompet pertama saat halaman dimuat
  useEffect(() => {
    if (walletData && walletData.length > 0 && !walletId) {
      setWalletId(walletData[0].id)
    }
  }, [walletData, walletId])

  const hutangMasuk = useMemo(() => {
    return txData.filter(t => 
      (t.type === 'in' && t.cat === 'Pinjaman') || 
      (t.type === 'in' && t.cat === 'Transfer' && t.sub_cat === 'Terima Pinjaman')
    )
  }, [txData])
  const totalHutang = hutangMasuk.reduce((sum, t) => sum + t.amount, 0)

  const cicilanKeluar = useMemo(() => {
    return txData.filter(t => 
      (t.type === 'out' && (t.cat === 'Bayar Cicilan' || t.cat === 'Kewajiban')) ||
      (t.type === 'out' && t.cat === 'Transfer' && t.sub_cat === 'Bayar Pinjaman')
    )
  }, [txData])
  const totalDibayar = cicilanKeluar.reduce((sum, t) => sum + t.amount, 0)

  const sisaHutang = Math.max(0, totalHutang - totalDibayar)
  const progress = totalHutang === 0 ? 0 : Math.min(100, (totalDibayar / totalHutang) * 100)

  const riwayatHutang = useMemo(() => {
    return [...hutangMasuk, ...cicilanKeluar].sort((a, b) => {
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      if (timeA !== timeB) return timeB - timeA
      
      const createA = a.created_at ? new Date(a.created_at).getTime() : Date.now()
      const createB = b.created_at ? new Date(b.created_at).getTime() : Date.now()
      return createB - createA
    })
  }, [hutangMasuk, cicilanKeluar])

  const handleSimpan = async () => {
    if (!desc.trim()) { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount <= 0) { setErr('Jumlah harus lebih dari 0'); return }
    if (!walletId) { setErr('Sumber dana (Dompet) wajib dipilih'); return } // Validasi wallet
    
    setBusy(true); setErr('')
    
    const isBayar = mode === 'bayar';
    const e = await addTx({
      desc: desc.trim(),
      amount: +amount,
      type: isBayar ? 'out' : 'in',
      cat: 'Transfer', 
      sub_cat: isBayar ? 'Bayar Pinjaman' : 'Terima Pinjaman',
      date: date,
      wallet_id: walletId // 👇 TAMBAHAN: Kirim data dompet ke database
    })
    
    setBusy(false)
    if (e) setErr(e.message)
    else {
      setDesc(''); 
      setAmount('');
    }
  }

  // Bantu mencari data dompet yang sedang aktif untuk warnanya
  const activeWallet = totals?.walletBalances?.find(w => w.id === walletId)

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Kewajiban & Cicilan</h1>
        <p className="text-muted text-sm font-medium mt-1">Pantau progres pelunasan hutang dan tagihanmu tanpa merusak laporan arus kas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── KOLOM KIRI: STATUS & FORM ───────────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm">
            <div className="w-12 h-12 bg-expense-light text-expense rounded-2xl flex items-center justify-center mb-5">
              <Landmark size={24} strokeWidth={2.5} />
            </div>
            <p className="text-muted font-bold text-sm uppercase tracking-wider mb-1">Sisa Kewajiban</p>
            <h2 className="text-3xl font-black text-text tabular-nums tracking-tight">
              {fmt(sisaHutang)}
            </h2>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-income">Telah dibayar: {fmtShort(totalDibayar)}</span>
                <span className="text-muted2">Total: {fmtShort(totalHutang)}</span>
              </div>
              <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-income rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress >= 100 && totalHutang > 0 && (
                <p className="text-invest text-xs font-bold flex items-center gap-1.5 mt-3 animate-fade-in">
                  <CheckCircle2 size={14} /> Hutang telah lunas!
                </p>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-[24px] p-6 shadow-sm">
            <div className="flex gap-2 p-1 bg-border rounded-xl mb-5">
              <button 
                onClick={() => {setMode('bayar'); setErr('')}}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'bayar' ? 'bg-surface text-gold shadow-sm' : 'text-muted hover:text-text-2'}`}
              >
                Bayar Cicilan
              </button>
              <button 
                onClick={() => {setMode('pinjam'); setErr('')}}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'pinjam' ? 'bg-surface text-income shadow-sm' : 'text-muted hover:text-text-2'}`}
              >
                Tambah Hutang
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Keterangan">
                <input 
                  type="text" 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  placeholder={mode === 'bayar' ? "Mis: Cicilan Motor Bulan 3" : "Mis: Pinjaman Bank"}
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

              {/* 👇 TAMBAHAN: Field Dropdown Dompet/Rekening 👇 */}
              <Field label={mode === 'bayar' ? "Gunakan Dana Dari" : "Terima Uang Ke"}>
                {totals?.walletBalances && totals.walletBalances.length > 0 ? (
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
                      onChange={(e) => setWalletId(e.target.value)}
                    >
                      <option value="" disabled>Pilih Sumber Dana...</option>
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
                    <Wallet size={16} className="text-slate-400" />
                    Belum ada dompet. Buat di Dashboard!
                  </div>
                )}
              </Field>

              <Field label="Tanggal">
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full bg-field border border-border rounded-xl py-3 px-4 focus:border-income text-sm outline-none cursor-pointer text-text-2"
                />
              </Field>

              {err && <div className="text-xs text-expense font-medium">{err}</div>}

              <button 
                onClick={handleSimpan} 
                disabled={busy}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 ${
                  mode === 'bayar' ? 'bg-gold hover:bg-orange-600' : 'bg-income hover:bg-blue-600'
                }`}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} 
                {mode === 'bayar' ? 'Catat Pembayaran' : 'Catat Pinjaman Baru'}
              </button>
            </div>
          </div>

        </div>

        {/* ── KOLOM KANAN: RIWAYAT ──────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2">
          <PanelHeader title="Riwayat Cicilan & Pinjaman" badge={`${riwayatHutang.length} aktivitas`} />
          
          <div className="mt-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {riwayatHutang.length > 0 ? (
              <div className="space-y-2">
                {riwayatHutang.map(t => (
                  <TxItem 
                    key={`hutang-${t.id}`} 
                    t={t} 
                    onDelete={deleteTx} 
                    walletName={walletData?.find(w => w.id === t.wallet_id)?.name} // 👇 TAMBAHAN: Tampilkan badge dompet di riwayat
                  />
                ))}
              </div>
            ) : (
              <div className="py-10">
                <Empty icon={<ReceiptText size={40} className="text-muted2 mb-3" strokeWidth={1} />} text="Belum ada riwayat hutang atau cicilan" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}