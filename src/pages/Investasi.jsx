import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, fmtUnit, today, INV_TYPES, CHART_COLORS } from '../lib/utils'
import { TxItem, Empty, Field, PanelHeader, BankLogo } from '../components/UI' 
import { 
  TrendingUp, TrendingDown, Pencil, Banknote, CalendarDays, 
  PlusCircle, Loader2, BriefcaseBusiness, Hash, Boxes, 
  PieChart as PieChartIcon, Search, Wallet, ChevronDown 
} from 'lucide-react'

const INV_KEYS = Object.keys(INV_TYPES)

export default function Investasi() {
  const { invData, addInv, updateInv, deleteInv, totals } = useData()
  
  const [editId,  setEditId]  = useState(null)
  const [action,  setAction]  = useState('beli')
  const [invType, setInvType] = useState('Saham')
  const [subType, setSubType] = useState(INV_TYPES['Saham'].subTypes[0])
  const [desc,    setDesc]    = useState('')
  const [amount,  setAmount]  = useState('')
  const [qty,     setQty]     = useState('')
  const [date,    setDate]    = useState(today())
  const [walletId, setWalletId] = useState('') 
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')

  const handleTypeChange = (t) => { setInvType(t); setSubType(INV_TYPES[t].subTypes[0]); setQty(''); setAmount('') }
  const cfg = INV_TYPES[invType]

  let availableQty = 0;
  let availableAmount = 0;

  invData.filter(t => t.subType === subType && t.id !== editId).forEach(t => {
    if (t.action === 'beli') {
      availableQty += (t.qty || 0);
      availableAmount += t.amount;
    } else {
      availableQty -= (t.qty || 0);
      availableAmount -= t.amount;
    }
  });
  availableQty = Number(availableQty.toFixed(4));

  const isPortfolioEmpty = action === 'jual' && (invType !== 'Uang' ? availableQty <= 0 : availableAmount <= 0);
  const isQtyError = action === 'jual' && invType !== 'Uang' && (+qty > availableQty);
  const isAmountError = action === 'jual' && invType === 'Uang' && (+amount > availableAmount);

  const handleEditClick = (t) => {
    setEditId(t.id);
    setAction(t.action);
    setInvType(t.invType);
    setSubType(t.subType || INV_TYPES[t.invType].subTypes[0]);
    setDesc(t.desc);
    setAmount(t.amount.toString());
    setQty(t.qty ? t.qty.toString() : '');
    setDate(t.date);
    setWalletId(t.wallet_id || '');
    setErr('');
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  const cancelEdit = () => {
    setEditId(null);
    setDesc(''); setAmount(''); setQty(''); setWalletId('');
    setErr('');
  }

  const handleAdd = async () => {
    if (!desc.trim()) { setErr('Keterangan wajib diisi'); return }
    if (!amount || +amount <= 0){ setErr('Nilai (Rp) harus lebih dari 0'); return }
    if (!walletId) { setErr('Pilih dompet/rekening tujuan terlebih dahulu'); return }

    setBusy(true); setErr('')
    
    const payload = { 
      invType, subType, desc: desc.trim(), amount: +amount, 
      action, unit: cfg.unit, qty: +qty || 0, date, 
      wallet_id: walletId 
    };

    let e;
    if (editId) {
      e = await updateInv(editId, payload);
    } else {
      e = await addInv(payload);
    }
    
    setBusy(false)
    if (e) setErr(e.message)
    else { cancelEdit() }
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

  const filteredInv = useMemo(() => {
    return invData.filter(t => {
      const q = searchQuery.toLowerCase()
      return (
        (t.desc && t.desc.toLowerCase().includes(q)) || 
        (t.invType && t.invType.toLowerCase().includes(q)) ||
        (t.subType && t.subType.toLowerCase().includes(q))
      )
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateB - dateA
      return (b.ts || 0) - (a.ts || 0)
    })
  }, [invData, searchQuery])

  const groupedInv = useMemo(() => {
    const groups = {}
    filteredInv.forEach(t => {
      const d = t.date || 'unknown'
      if (!groups[d]) groups[d] = { items: [], totalBeli: 0, totalJual: 0 }
      groups[d].items.push(t)
      if (t.action === 'beli') groups[d].totalBeli += t.amount
      if (t.action === 'jual') groups[d].totalJual += t.amount
    })
    return groups
  }, [filteredInv])

  const getDayLabel = (dateStr) => {
    if (!dateStr || dateStr === 'unknown') return "Tanggal Tidak Diketahui"
    const d = new Date(dateStr)
    const todayObj = new Date()
    const yesterdayObj = new Date(todayObj)
    yesterdayObj.setDate(yesterdayObj.getDate() - 1)
    if (d.toISOString().split('T')[0] === todayObj.toISOString().split('T')[0]) return "Hari Ini"
    if (d.toISOString().split('T')[0] === yesterdayObj.toISOString().split('T')[0]) return "Kemarin"
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const activeWallet = totals?.walletBalances?.find(w => w.id === walletId)

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div>
        <h1 className="tabular-nums font-bold text-2xl text-slate-800 dark:text-white tracking-tight">Portofolio Investasi</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Kelola dan pantau aset kekayaanmu.</p>
      </div>

      <div className="bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 lg:p-8 shadow-sm transition-colors">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Aset</p>
        <p className="tabular-nums font-bold text-4xl md:text-5xl mb-6 tracking-tight text-emerald-500">{fmt(totalPortfolio)}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/50">
          {INV_KEYS.map(k => (
            <div key={k}>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold flex items-center gap-1.5 mb-1">
                <span className="scale-75 grayscale opacity-70 dark:opacity-100 dark:grayscale-0">{INV_TYPES[k].icon}</span> {k}
              </p>
              <p className="tabular-nums font-bold text-lg text-slate-700 dark:text-slate-200">{fmtShort(Math.max(0,byType[k]))}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INV_KEYS.map(k => {
          const c = INV_TYPES[k]; const isActive = invType===k
          return (
            <button key={k} onClick={()=>handleTypeChange(k)}
              className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[20px] border transition-all cursor-pointer ${
                isActive ? 'bg-white dark:bg-slate-800 shadow-sm border-slate-300 dark:border-slate-600' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-slate-700 opacity-70 hover:opacity-100'
              }`}>
              <div className={`scale-110 transition-all ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'grayscale text-slate-500 dark:text-slate-400'}`}>{c.icon}</div>
              <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{k}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        <div className={`bg-white dark:bg-[#1E2336] border ${editId ? 'border-indigo-300 dark:border-indigo-500/50 ring-4 ring-indigo-50 dark:ring-indigo-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 space-y-5 transition-all`}>
          <PanelHeader title={editId ? `Edit Transaksi ${invType}` : `Catat Transaksi ${invType}`} badge={editId ? 'Mode Edit' : ''} />

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => setAction('beli')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                action === 'beli' ? 'bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}>
              <TrendingUp size={18} strokeWidth={2.5} /> Pembelian
            </button>
            <button onClick={() => setAction('jual')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                action === 'jual' ? 'bg-orange-50/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}>
              <TrendingDown size={18} strokeWidth={2.5} /> Penjualan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jenis Produk">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none"><Boxes size={16} strokeWidth={2.5} /></div>
                <select className="form-input pl-14 py-3 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEuNSAxLjVMNiA2TDEwLjUgMS41IiBzdHJva2U9IiM5NDkzQjgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-[position:calc(100%-16px)_center]" value={subType} onChange={e => { setSubType(e.target.value); setErr('') }}>
                  {cfg.subTypes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Keterangan">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none"><Pencil size={16} strokeWidth={2.5} /></div>
                <input className="form-input pl-14 py-3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mis. Beli saat koreksi..." />
              </div>
            </Field>

            {invType !== 'Uang' && (
              <Field label={cfg.unitLabel}>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none"><Hash size={16} strokeWidth={2.5} /></div>
                  <input 
                    className={`form-input pl-14 pr-16 py-3 transition-colors ${
                      isQtyError || (isPortfolioEmpty && qty) ? 'border-rose-500 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 focus:border-rose-600' : ''
                    }`} 
                    type="text" 
                    inputMode="decimal" 
                    value={qty} 
                    onChange={e => { let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, ''); const parts = val.split('.'); if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join(''); setQty(val); setErr('') }} 
                    placeholder={cfg.unitPlaceholder} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 dark:text-slate-300 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg">{cfg.unit}</span>
                </div>
                {/* VALIDASI QTY REAL-TIME */}
                {action === 'jual' && isPortfolioEmpty && (
                  <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1.5 leading-tight">Anda belum memiliki aset {subType} ini.</p>
                )}
                {action === 'jual' && !isPortfolioEmpty && isQtyError && (
                  <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1.5 leading-tight">Maksimal yang bisa dijual: {fmtUnit(availableQty)} {cfg.unit}</p>
                )}
              </Field>
            )}

            <Field label="Total Nilai (Rp)">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none"><Banknote size={16} strokeWidth={2.5} /></div>
                <input 
                  className={`form-input pl-14 py-3 transition-colors ${
                    isAmountError || (isPortfolioEmpty && amount && invType === 'Uang') ? 'border-rose-500 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 focus:border-rose-600' : ''
                  }`} 
                  type="text" 
                  inputMode="numeric" 
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                  onChange={e => { setAmount(e.target.value.replace(/\D/g, '')); setErr('') }} 
                  placeholder="0" 
                />
              </div>
              {/* VALIDASI AMOUNT REAL-TIME (KHUSUS TIPE UANG) */}
              {invType === 'Uang' && action === 'jual' && (
                isPortfolioEmpty ? (
                  <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1.5 leading-tight">Saldo portofolio {subType} kosong.</p>
                ) : isAmountError ? (
                  <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1.5 leading-tight">Maksimal tarik: Rp {availableAmount.toLocaleString('id-ID')}</p>
                ) : null
              )}
            </Field>

            <Field label={action === 'beli' ? "Potong Saldo Dari:" : "Masukkan Saldo Ke:"}>
              {totals?.walletBalances && totals.walletBalances.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white" style={{ backgroundColor: activeWallet?.color || '#94a3b8' }}>
                    <Wallet size={16} strokeWidth={2.5} />
                  </div>
                  <select
                    className="form-input pl-14 pr-10 py-3 text-sm cursor-pointer appearance-none bg-transparent relative z-0 font-semibold text-slate-700 dark:text-slate-100"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                  >
                    <option value="" disabled>Pilih Dompet...</option>
                    {totals.walletBalances.map(w => (
                      <option key={w.id} value={w.id}>{w.name} — Rp {Math.abs(w.calculatedBalance).toLocaleString('id-ID')}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} strokeWidth={2.5} /></div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400" /> Belum ada dompet. Buat di Dashboard!
                </div>
              )}
            </Field>

            <Field label="Tanggal Transaksi">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center pointer-events-none"><CalendarDays size={16} strokeWidth={2.5} /></div>
                <input className="form-input pl-14 py-3 cursor-pointer text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </Field>
          </div>

          {err && <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3 font-medium">{err}</div>}

          <div className="flex gap-3 mt-2">
            {editId && (
              <button onClick={cancelEdit} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Batal Edit
              </button>
            )}
            <button onClick={handleAdd} disabled={busy || isQtyError || isAmountError || isPortfolioEmpty}
              className={`flex-[2] py-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'beli' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : (editId ? <Pencil size={18} /> : <PlusCircle size={18} />)} 
              {editId ? 'Simpan Perubahan' : `Catat ${action === 'beli' ? 'Pembelian' : 'Penjualan'}`}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col transition-colors">
          <PanelHeader title="Alokasi Aset" />
          <div className="flex-1 flex flex-col justify-center mt-2">
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                      {donutData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtShort(v)} wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-6">
                  {donutData.map(d => (
                    <div key={d.name} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-full" style={{background: d.fill}} /><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{d.name}</span></div>
                      <span className="tabular-nums font-bold text-sm text-slate-800 dark:text-slate-100">{fmtShort(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <PieChartIcon size={48} className="text-slate-300 dark:text-slate-600 mb-3" strokeWidth={1} />
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Portofolio kosong</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.keys(subBreakdown).length > 0 && (
          <div className="bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm overflow-x-auto transition-colors">
            <PanelHeader title={`Detail ${invType}`} />
            <table className="w-full text-sm mt-2 text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/50 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-3 font-semibold">Produk</th>
                  <th className="py-3 font-semibold text-right">Saldo Unit</th>
                  <th className="py-3 font-semibold text-right">Net Investasi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subBreakdown).map(([sub,v])=>(
                  <tr key={sub} className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 font-bold text-slate-700 dark:text-slate-200">{sub}</td>
                    <td className="py-3 text-right font-medium text-slate-500 dark:text-slate-400 tabular-nums">{v.qty > 0 ? fmtUnit(v.qty) : '—'}</td>
                    <td className={`py-3 text-right tabular-nums font-bold ${(v.buy-v.sell)>=0?'text-emerald-500':'text-orange-500'}`}>{fmtShort(v.buy-v.sell)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white dark:bg-[#1E2336] border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm transition-colors">
          <PanelHeader title="Riwayat Investasi" badge={`${filteredInv.length} transaksi`} />
          <div className="relative mt-4 mb-3">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} /></div>
            <input type="text" placeholder="Cari nama, tipe, atau keterangan aset..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-[#121629] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div className="space-y-1.5 mt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.keys(groupedInv).length > 0 ? (
              Object.keys(groupedInv).sort((a,b) => new Date(b) - new Date(a)).map(dateKey => {
                const group = groupedInv[dateKey];
                const isToday = getDayLabel(dateKey) === "Hari Ini";
                return (
                  <div key={dateKey} className="mb-6 last:mb-0 animate-fade-up">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800/50 pb-2.5 mb-3 sticky top-0 bg-white dark:bg-[#1E2336] z-10">
                      <h4 className={`font-bold text-sm ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>{getDayLabel(dateKey)}</h4>
                      <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                        {group.totalJual > 0 && <span className="text-orange-500 dark:text-orange-400">+ {fmtShort(group.totalJual)}</span>}
                        {group.totalBeli > 0 && <span className="text-emerald-500 dark:text-emerald-400">- {fmtShort(group.totalBeli)}</span>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map(t => (
                        <div key={t.id} onClick={(e) => { if (e.target.closest('button')) return; handleEditClick(t); }} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors ring-2 ring-transparent hover:ring-emerald-50 dark:hover:ring-emerald-500/20 group" title="Klik untuk edit">
                          <div className="pointer-events-auto"><TxItem t={t} onDelete={deleteInv} isInv={true} walletName={totals?.walletBalances?.find(w => w.id === t.wallet_id)?.name} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-8"><Empty icon={<BriefcaseBusiness size={40} className="text-slate-300 dark:text-slate-600 mb-3" strokeWidth={1} />} text="Transaksi tidak ditemukan" /></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}