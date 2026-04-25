import { useState } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today, CATEGORIES, CAT_ICONS } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader, SummaryRow } from '../components/UI'
import { ArrowDownLeft, ArrowUpRight, Pencil, Banknote, Calendar, PlusCircle, ReceiptText, Loader2, Tag } from 'lucide-react'

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

  const handleAdd = async () => {
    if (!desc.trim())       { setErr('Keterangan wajib diisi'); return }
    if (!amount||+amount<=0){ setErr('Jumlah harus lebih dari 0'); return }
    setBusy(true); setErr('')
    const e = await addTx({ desc:desc.trim(), amount:+amount, type, cat:type==='out'?cat:'Pemasukan', date })
    setBusy(false)
    if (e) setErr(e.message)
    else { setDesc(''); setAmount('') }
  }

  const filtered = filter === 'semua' ? txData : txData.filter(t => t.type === filter)

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div>
        <h1 className="font-syne font-bold text-2xl text-slate-800 tracking-tight">Transaksi</h1>
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
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none">
                  <Pencil size={16} strokeWidth={2.5} />
                </div>
                <input className="form-input pl-14 py-3 border-slate-200 focus:border-indigo-500" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mis. Gaji bulanan..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
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
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none bg-white pr-2">
                    {CAT_ICONS[cat] || <Tag size={18} className="text-slate-400" />}
                  </div>
                  <select className="form-input pl-[2.75rem] py-3 cursor-pointer appearance-none border-slate-200 focus:border-indigo-500 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEuNSAxLjVMNiA2TDEwLjUgMS41IiBzdHJva2U9IiM5NDkzQjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-[position:calc(100%-16px)_center]" value={cat} onChange={e => setCat(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
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
              <span className={`font-syne font-black text-2xl tracking-tight ${totals.saldo>=0?'text-slate-800':'text-rose-500'}`}>{fmt(totals.saldo)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST RIWAYAT ─────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm">
        <PanelHeader title="Riwayat Transaksi" badge={`${filtered.length} total`} />
        <div className="mb-4">
          <Tabs value={filter} onChange={setFilter} options={[
            { value: 'semua', label: 'Semua' },
            { value: 'in',    label: 'Pemasukan' },
            { value: 'out',   label: 'Pengeluaran' },
          ]} />
        </div>
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filtered.length > 0
            ? filtered.map(t => <TxItem key={t.id} t={t} onDelete={deleteTx} />)
            : <div className="py-8"><Empty icon={<ReceiptText size={40} className="text-slate-300 mb-3" strokeWidth={1} />} text="Belum ada transaksi" /></div>}
        </div>
      </div>
    </div>
  )
}