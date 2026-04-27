import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today } from '../lib/utils'
import { TxItem, PanelHeader, Empty, Field } from '../components/UI'
import { Landmark, CheckCircle2, ReceiptText, PlusCircle, Loader2 } from 'lucide-react'

export default function Hutang() {
  const { txData, addTx, deleteTx } = useData()
  
  // State untuk form input cepat
  const [mode, setMode] = useState('bayar') 
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(today()) // <-- TAMBAHAN: State untuk Tanggal
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // 1. AMBIL DATA PINJAMAN (Target Hutang)
  const hutangMasuk = useMemo(() => {
    return txData.filter(t => t.type === 'in' && t.cat === 'Pinjaman')
  }, [txData])
  const totalHutang = hutangMasuk.reduce((sum, t) => sum + t.amount, 0)

  // 2. AMBIL DATA PEMBAYARAN (Telah Dibayar)
  const cicilanKeluar = useMemo(() => {
    return txData.filter(t => t.type === 'out' && (t.cat === 'Bayar Cicilan' || t.cat === 'Kewajiban'))
  }, [txData])
  const totalDibayar = cicilanKeluar.reduce((sum, t) => sum + t.amount, 0)

  // 3. KALKULASI
  const sisaHutang = Math.max(0, totalHutang - totalDibayar)
  const progress = totalHutang === 0 ? 0 : Math.min(100, (totalDibayar / totalHutang) * 100)

  // 4. GABUNGKAN RIWAYAT KEDUANYA
  const riwayatHutang = useMemo(() => {
    return [...hutangMasuk, ...cicilanKeluar].sort((a, b) => {
      // Urutkan berdasarkan tanggal, lalu berdasarkan waktu pembuatan agar akurat
      const timeA = new Date(a.date).getTime()
      const timeB = new Date(b.date).getTime()
      if (timeA !== timeB) return timeB - timeA
      
      const createA = a.created_at ? new Date(a.created_at).getTime() : Date.now()
      const createB = b.created_at ? new Date(b.created_at).getTime() : Date.now()
      return createB - createA
    })
  }, [hutangMasuk, cicilanKeluar])

  // Fungsi simpan transaksi (Otomatis menggunakan kategori yang tepat)
  const handleSimpan = async () => {
    if (!desc.trim()) { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount <= 0) { setErr('Jumlah harus lebih dari 0'); return }
    
    setBusy(true); setErr('')
    
    const e = await addTx({
      desc: desc.trim(),
      amount: +amount,
      type: mode === 'bayar' ? 'out' : 'in',
      cat: mode === 'bayar' ? 'Kewajiban' : 'Pinjaman', 
      date: date // <-- PERBAIKAN: Gunakan state date yang dipilih user, bukan today()
    })
    
    setBusy(false)
    if (e) setErr(e.message)
    else {
      setDesc(''); 
      setAmount('');
      // Kita biarkan tanggalnya tetap di posisi terakhir user memilih, agar praktis jika input banyak data
    }
  }

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Kewajiban & Cicilan</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Pantau progres pelunasan hutang dan tagihanmu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── KOLOM KIRI: STATUS & FORM ───────────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* KARTU PROGRES */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-5">
              <Landmark size={24} strokeWidth={2.5} />
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Sisa Kewajiban</p>
            <h2 className="text-3xl font-black text-slate-800 tabular-nums tracking-tight">
              {fmt(sisaHutang)}
            </h2>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-indigo-600">Telah dibayar: {fmtShort(totalDibayar)}</span>
                <span className="text-slate-400">Total: {fmtShort(totalHutang)}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress >= 100 && totalHutang > 0 && (
                <p className="text-emerald-500 text-xs font-bold flex items-center gap-1.5 mt-3 animate-fade-in">
                  <CheckCircle2 size={14} /> Hutang telah lunas!
                </p>
              )}
            </div>
          </div>

          {/* FORM INPUT CEPAT */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
              <button 
                onClick={() => {setMode('bayar'); setErr('')}}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'bayar' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Bayar Cicilan
              </button>
              <button 
                onClick={() => {setMode('pinjam'); setErr('')}}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'pinjam' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 text-sm outline-none"
                />
              </Field>

              <Field label="Jumlah (Rp)">
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} 
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 text-sm outline-none font-medium tabular-nums"
                />
              </Field>

              {/* <-- TAMBAHAN: Field Tanggal --> */}
              <Field label="Tanggal">
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:border-indigo-500 text-sm outline-none cursor-pointer text-slate-700"
                />
              </Field>

              {err && <div className="text-xs text-rose-600 font-medium">{err}</div>}

              <button 
                onClick={handleSimpan} 
                disabled={busy}
                className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 mt-2 ${
                  mode === 'bayar' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} 
                {mode === 'bayar' ? 'Catat Pembayaran' : 'Catat Pinjaman Baru'}
              </button>
            </div>
          </div>

        </div>

        {/* ── KOLOM KANAN: RIWAYAT ──────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2">
          <PanelHeader title="Riwayat Cicilan & Pinjaman" badge={`${riwayatHutang.length} aktivitas`} />
          
          <div className="mt-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {riwayatHutang.length > 0 ? (
              <div className="space-y-2">
                {riwayatHutang.map(t => (
                  <TxItem 
                    key={`hutang-${t.id}`} 
                    t={t} 
                    onDelete={deleteTx} // <-- Tambahan: Biar bisa langsung hapus dari sini
                  />
                ))}
              </div>
            ) : (
              <div className="py-10">
                <Empty icon={<ReceiptText size={40} className="text-slate-300 mb-3" strokeWidth={1} />} text="Belum ada riwayat hutang atau cicilan" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}