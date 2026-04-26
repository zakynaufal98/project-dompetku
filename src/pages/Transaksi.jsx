import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today, CATEGORIES, CAT_ICONS } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader, SummaryRow } from '../components/UI'
import { 
  ArrowDownLeft, ArrowUpRight, Pencil, Banknote, 
  Calendar, PlusCircle, ReceiptText, Loader2, Tag, Search 
} from 'lucide-react'
import DescInput from '../components/DescInput'
import CategoryInput from '../components/CategoryInput'

export default function Transaksi() {
  const { txData, addTx, deleteTx, totals } = useData()
  const [type,   setType]   = useState('out')
  const [desc,   setDesc]   = useState('')
  const [amount, setAmount] = useState('')
  const [cat,    setCat]    = useState(CATEGORIES[0])
  const [date,   setDate]   = useState(today())
  const [filter, setFilter] = useState('semua')
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')

  const handleAdd = async () => {
    if (!desc.trim())       { setErr('Keterangan wajib diisi'); return }
    if (!amount||+amount<=0){ setErr('Jumlah harus lebih dari 0'); return }
    setBusy(true); setErr('')
    const e = await addTx({ desc:desc.trim(), amount:+amount, type, cat:type==='out'?cat:'Pemasukan', date })
    setBusy(false)
    if (e) setErr(e.message)
    else { setDesc(''); setAmount('') }
  }

  // 1. LOGIKA FILTER & SORTING (Terbaru di atas)
  // 1. LOGIKA FILTER & SORTING (Terbaru di atas)
  // 1. LOGIKA FILTER & SORTING (Terbaru selalu di atas - REVISI FINAL)
  const filtered = txData
    .filter(t => {
      const matchTab = filter === 'semua' || t.type === filter
      const q = searchQuery.toLowerCase()
      const matchSearch = (t.desc && t.desc.toLowerCase().includes(q)) || 
                          (t.cat && t.cat.toLowerCase().includes(q))
      return matchTab && matchSearch
    })
    .sort((a, b) => {
      // 1. Urutkan berdasarkan Tanggal Kalender (Misal: 26 April vs 25 April)
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateB - dateA
      
      // 2. JIKA TANGGAL SAMA: Gunakan waktu detail jika tersedia dari database
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      
      // 3. JURUS PAMUNGKAS (Fallback)
      // Jika waktu detail kosong, gunakan posisi index asli di database.
      // Data yang baru diinput selalu punya index lebih besar. Kita balik urutannya (b - a).
      return txData.indexOf(b) - txData.indexOf(a)
    })

  // 2. LOGIKA GROUPING (MENGELOMPOKKAN TRANSAKSI PER HARI)
  const groupedTx = useMemo(() => {
    const groups = {}
    filtered.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = { items: [], totalIn: 0, totalOut: 0 }
      }
      groups[t.date].items.push(t)
      if (t.type === 'in') groups[t.date].totalIn += t.amount
      if (t.type === 'out') groups[t.date].totalOut += t.amount
    })
    return groups
  }, [filtered])

  // Fungsi untuk mengubah tanggal menjadi "Hari Ini", "Kemarin", dsb.
  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr)
    const todayObj = new Date()
    const yesterdayObj = new Date(todayObj)
    yesterdayObj.setDate(yesterdayObj.getDate() - 1)

    const dString = d.toISOString().split('T')[0]
    const todayString = todayObj.toISOString().split('T')[0]
    const yesterdayString = yesterdayObj.toISOString().split('T')[0]

    if (dString === todayString) return "Hari Ini"
    if (dString === yesterdayString) return "Kemarin"
    
    // Format: 24 April 2026
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Transaksi</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Catat dan pantau arus kas harianmu.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ── FORM PANEL ───────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 space-y-5">
          <PanelHeader title="Tambah Transaksi" />

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => setType('in')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'in' ? 'bg-indigo-50/50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
              }`}>
              <ArrowDownLeft size={18} strokeWidth={2.5} /> Pemasukan
            </button>
            <button onClick={() => setType('out')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'out' ? 'bg-orange-50/50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
              }`}>
              <ArrowUpRight size={18} strokeWidth={2.5} /> Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Keterangan">
              <DescInput 
                value={desc} 
                onChange={setDesc} 
                txData={txData} 
                onEnter={handleAdd} 
              />
            </Field>

            <Field label="Jumlah (Rp)">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none">
                  <Banknote size={16} strokeWidth={2.5} />
                </div>
                <input className="form-input pl-14 py-3 border-slate-200 focus:border-indigo-500" type="text" inputMode="numeric" value={amount ? Number(amount).toLocaleString('id-ID') : ''} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
            </Field>

            {type === 'out' && (
              <Field label="Kategori">
                 {/* Panggil komponen pintar kita di sini! */}
                 <CategoryInput value={cat} onChange={setCat} />
              </Field>
            )}

            <Field label="Tanggal">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
                <input className="form-input pl-14 py-3 cursor-pointer border-slate-200 focus:border-indigo-500 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </Field>
          </div>

          {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-4 py-3 font-medium">{err}</div>}

          <button onClick={handleAdd} disabled={busy}
            className={`w-full py-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 mt-2 ${
              type === 'in' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />} Tambah Transaksi
          </button>
        </div>

        {/* ── QUICK STATS ──────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Ringkasan" />
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <SummaryRow label="Pemasukan" value={fmt(totals.totalIn)} valueClass="text-indigo-600 font-bold" />
            <SummaryRow label="Pengeluaran" value={fmt(totals.totalOut)} valueClass="text-orange-500 font-bold" />
            <SummaryRow label="Investasi" value={fmt(Math.max(0,totals.invNet))} valueClass="text-emerald-500 font-bold" />
            <div className="mt-4 pt-5 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Bersih</span>
              <span className={`tabular-nums font-black text-2xl tracking-tight ${totals.saldo>=0?'text-slate-800':'text-rose-500'}`}>{fmt(totals.saldo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST RIWAYAT (SUDAH DI-GROUP PER HARI) ────── */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
        <PanelHeader title="Riwayat Transaksi" badge={`${filtered.length} total`} />
        
        <div className="mb-4">
          <Tabs value={filter} onChange={setFilter} options={[
            { value: 'semua', label: 'Semua' },
            { value: 'in',    label: 'Pemasukan' },
            { value: 'out',   label: 'Pengeluaran' },
          ]} />
        </div>

        {/* BAR PENCARIAN (SEARCH BAR) */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Cari transaksi berdasarkan nama atau kategori..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedTx).length > 0 ? (
            Object.keys(groupedTx).map(dateKey => {
              const group = groupedTx[dateKey];
              const isToday = getDayLabel(dateKey) === "Hari Ini";
              
              return (
                <div key={dateKey} className="mb-8 last:mb-0 animate-fade-up">
                  {/* HEADER TANGGAL */}
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2.5 mb-3 sticky top-0 bg-white z-10">
                    <h4 className={`font-bold text-sm ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {getDayLabel(dateKey)}
                    </h4>
                    <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                      {group.totalIn > 0 && <span className="text-indigo-500">+ {fmtShort(group.totalIn)}</span>}
                      {group.totalOut > 0 && <span className="text-orange-500">- {fmtShort(group.totalOut)}</span>}
                    </div>
                  </div>
                  
                  {/* DAFTAR TRANSAKSI DI HARI TERSEBUT */}
                  <div className="space-y-1.5">
                    {group.items.map(t => <TxItem key={t.id} t={t} onDelete={deleteTx} />)}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8">
              <Empty icon={<ReceiptText size={40} className="text-slate-300 mb-3" strokeWidth={1} />} text="Transaksi tidak ditemukan" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}