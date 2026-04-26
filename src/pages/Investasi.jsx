import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, fmtUnit, today, INV_TYPES, CHART_COLORS } from '../lib/utils'
import { TxItem, Empty, Field, PanelHeader } from '../components/UI'
import { 
  TrendingUp, TrendingDown, Pencil, Banknote, CalendarDays, 
  PlusCircle, Loader2, BriefcaseBusiness, Hash, Boxes, 
  PieChart as PieChartIcon, Search 
} from 'lucide-react'

const INV_KEYS = Object.keys(INV_TYPES)

export default function Investasi() {
  const { invData, addInv, deleteInv } = useData()
  const [action,  setAction]  = useState('beli')
  const [invType, setInvType] = useState('Saham')
  const [subType, setSubType] = useState(INV_TYPES['Saham'].subTypes[0])
  const [desc,    setDesc]    = useState('')
  const [amount,  setAmount]  = useState('')
  const [qty,     setQty]     = useState('')
  const [date,    setDate]    = useState(today())
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  
  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState('')

  const handleTypeChange = (t) => { setInvType(t); setSubType(INV_TYPES[t].subTypes[0]); setQty(''); setAmount('') }
  const cfg = INV_TYPES[invType]

  const handleAdd = async () => {
    if (!desc.trim()) { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount <= 0){ setErr('Nilai (Rp) harus lebih dari 0'); return }
    setBusy(true); setErr('')
    const e = await addInv({ invType, subType, desc: desc.trim(), amount: +amount, action, unit: cfg.unit, qty: +qty || 0, date })
    setBusy(false)
    if (e) setErr(e.message)
    else { setDesc(''); setAmount(''); setQty('') }
  }

  const byType = useMemo(() => {
    const m = {}
    INV_KEYS.forEach(k => { m[k] = 0 })
    invData.forEach(t => { m[t.invType] += (t.action==='beli'?1:-1)*t.amount })
    return m
  }, [invData])

  const donutData = INV_KEYS.filter(k=>byType[k]>0).map((k) => ({name:k, value:byType[k], fill:INV_TYPES[k].color}))
  const totalPortfolio = Object.values(byType).filter(v=>v>0).reduce((s,v)=>s+v,0)

  const subBreakdown = useMemo(() => {
    const m = {}
    invData.filter(t=>t.invType===invType).forEach(t=>{
      const key = t.subType||t.invType
      if (!m[key]) m[key]={buy:0,sell:0,qty:0}
      if (t.action==='beli') { m[key].buy+=t.amount; m[key].qty+=t.qty||0 }
      else { m[key].sell+=t.amount; m[key].qty-=t.qty||0 }
    })
    return m
  }, [invData, invType])

  // Logika filter data pencarian
  const filteredInv = invData.filter(t => {
    const q = searchQuery.toLowerCase()
    return (
      (t.desc && t.desc.toLowerCase().includes(q)) || 
      (t.invType && t.invType.toLowerCase().includes(q)) ||
      (t.subType && t.subType.toLowerCase().includes(q))
    )
  })

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Portofolio Investasi</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Kelola dan pantau aset kekayaanmu.</p>
      </div>

      {/* PORTFOLIO SUMMARY HEADER */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 lg:p-8 shadow-sm">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Aset</p>
        <p className="tabular-nums font-bold text-4xl md:text-5xl mb-6 tracking-tight text-emerald-500">{fmt(totalPortfolio)}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
          {INV_KEYS.map(k => (
            <div key={k}>
              <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <span className="scale-75 grayscale opacity-70">{INV_TYPES[k].icon}</span> {k}
              </p>
              <p className="tabular-nums font-bold text-lg text-slate-700">{fmtShort(Math.max(0,byType[k]))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TYPE SELECTOR PILLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INV_KEYS.map(k => {
          const c = INV_TYPES[k]; const isActive = invType===k
          return (
            <button key={k} onClick={()=>handleTypeChange(k)}
              className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] border transition-all cursor-pointer ${
                isActive ? 'bg-white shadow-sm border-slate-300' : 'bg-slate-50 border-transparent hover:border-slate-200 opacity-70 hover:opacity-100'
              }`}>
              <div className="scale-110 grayscale" style={isActive ? { filter: 'none' } : {}}>{c.icon}</div>
              <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{k}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ── FORM PANEL ───────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 space-y-5">
          <PanelHeader title={`Catat Transaksi ${invType}`} />

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => setAction('beli')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                action === 'beli' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
              }`}>
              <TrendingUp size={18} strokeWidth={2.5} /> Pembelian
            </button>
            <button onClick={() => setAction('jual')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                action === 'jual' ? 'bg-orange-50/50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-500 border-transparent hover:border-slate-200'
              }`}>
              <TrendingDown size={18} strokeWidth={2.5} /> Penjualan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jenis Produk">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none"><Boxes size={16} strokeWidth={2.5} /></div>
                <select className="form-input pl-14 py-3 cursor-pointer appearance-none border-slate-200 focus:border-emerald-500 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEuNSAxLjVMNiA2TDEwLjUgMS41IiBzdHJva2U9IiM5NDkzQjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-[position:calc(100%-16px)_center]" value={subType} onChange={e => setSubType(e.target.value)}>
                  {cfg.subTypes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Keterangan">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none"><Pencil size={16} strokeWidth={2.5} /></div>
                <input className="form-input pl-14 py-3 border-slate-200 focus:border-emerald-500" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mis. Beli saat koreksi..." />
              </div>
            </Field>

            {invType !== 'Uang' && (
              <Field label={cfg.unitLabel}>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none"><Hash size={16} strokeWidth={2.5} /></div>
                  <input className="form-input pl-14 pr-16 py-3 border-slate-200 focus:border-emerald-500" type="text" inputMode="decimal" value={qty} onChange={e => { let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, ''); const parts = val.split('.'); if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join(''); setQty(val) }} placeholder={cfg.unitPlaceholder} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-lg">{cfg.unit}</span>
                </div>
              </Field>
            )}

            <Field label="Total Nilai (Rp)">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none"><Banknote size={16} strokeWidth={2.5} /></div>
                <input className="form-input pl-14 py-3 border-slate-200 focus:border-emerald-500" type="text" inputMode="numeric" value={amount ? Number(amount).toLocaleString('id-ID') : ''} onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="0" />
              </div>
            </Field>

            <Field label="Tanggal Transaksi" className="sm:col-span-2">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center pointer-events-none"><CalendarDays size={16} strokeWidth={2.5} /></div>
                <input className="form-input pl-14 py-3 cursor-pointer border-slate-200 focus:border-emerald-500 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </Field>
          </div>

          {err && <div className="text-xs text-rose-600 bg-rose-50 rounded-xl px-4 py-3 font-medium">{err}</div>}

          <button onClick={handleAdd} disabled={busy}
            className={`w-full py-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 mt-2 ${
              action === 'beli' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />} Catat {action === 'beli' ? 'Pembelian' : 'Penjualan'}
          </button>
        </div>

        {/* ── PORTFOLIO DONUT ───────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col">
          <PanelHeader title="Alokasi Aset" />
          <div className="flex-1 flex flex-col justify-center mt-2">
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                      {donutData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtShort(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-6">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full" style={{background: d.fill}} />
                        <span className="text-sm font-semibold text-slate-600">{d.name}</span>
                      </div>
                      <span className="tabular-nums font-bold text-sm text-slate-800">{fmtShort(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <PieChartIcon size={48} className="text-slate-300 mb-3" strokeWidth={1} />
                <p className="text-sm text-slate-400 font-medium">Portofolio kosong</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DETAIL & HISTORY ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(subBreakdown).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm overflow-x-auto">
            <PanelHeader title={`Detail ${invType}`} />
            <table className="w-full text-sm mt-2 text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 font-semibold">Produk</th>
                  <th className="py-3 font-semibold text-right">Saldo Unit</th>
                  <th className="py-3 font-semibold text-right">Net Investasi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subBreakdown).map(([sub,v])=>(
                  <tr key={sub} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-bold text-slate-700">{sub}</td>
                    <td className="py-3 text-right font-medium text-slate-500 tabular-nums">{v.qty > 0 ? fmtUnit(v.qty) : '—'}</td>
                    <td className={`py-3 text-right tabular-nums font-bold ${(v.buy-v.sell)>=0?'text-emerald-500':'text-orange-500'}`}>{fmtShort(v.buy-v.sell)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
          <PanelHeader title="Riwayat Investasi" badge={`${filteredInv.length} transaksi`} />
          
          {/* BAR PENCARIAN (SEARCH BAR) */}
          <div className="relative mt-4 mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama, tipe, atau keterangan aset..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5 mt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredInv.length > 0 ? (
              filteredInv.map(t => <TxItem key={t.id} t={t} onDelete={deleteInv} isInv />)
            ) : (
              <div className="py-8">
                <Empty icon={<BriefcaseBusiness size={40} className="text-slate-300 mb-3" strokeWidth={1} />} text="Transaksi tidak ditemukan" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}