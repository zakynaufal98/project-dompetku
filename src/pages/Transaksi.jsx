import { useState, useMemo, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today, CATEGORIES, CAT_ICONS } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader, SummaryRow } from '../components/UI'
import CategoryInput from '../components/CategoryInput'
import DescInput from '../components/DescInput'
import { 
  ArrowDownLeft, ArrowUpRight, Banknote, 
  Calendar, PlusCircle, ReceiptText, Loader2, Search,
  Wallet, ChevronDown
} from 'lucide-react'

export default function Transaksi() {
  const { txData, invData, addTx, deleteTx, totals, walletData } = useData() 
  
  const [type,   setType]   = useState('out')
  const [desc,   setDesc]   = useState('')
  const [amount, setAmount] = useState('')
  const [cat,    setCat]    = useState('')
  const [date,   setDate]   = useState(today())
  const [walletId, setWalletId] = useState('') 
  
  const [filter, setFilter] = useState('semua')
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(today().substring(0, 7)) 

  useEffect(() => {
    if (walletData && walletData.length > 0 && !walletId) {
      setWalletId(walletData[0].id)
    }
  }, [walletData, walletId])

  const suggestedAmounts = useMemo(() => {
    if (!desc.trim()) return [];
    const matches = txData.filter(t => t.desc && t.desc.toLowerCase() === desc.trim().toLowerCase() && t.type === type);
    const uniqueAmounts = [...new Set(matches.map(t => t.amount))];
    return uniqueAmounts.slice(0, 3);
  }, [desc, txData, type]);

  const handleAdd = async () => {
    if (!desc.trim())       { setErr('Keterangan wajib diisi'); return }
    if (!amount||+amount<=0){ setErr('Jumlah harus lebih dari 0'); return }
    if (type === 'out' && !cat) { setErr('Kategori wajib dipilih'); return }
    
    setBusy(true); setErr('')
    
    const e = await addTx({ 
      desc: desc.trim(), 
      amount: +amount, 
      type, 
      cat: type === 'out' ? cat : 'Pemasukan', 
      date,
      wallet_id: walletId || null 
    })
    
    setBusy(false)
    
    if (e) setErr(e.message)
    else { 
      setDesc(''); 
      setAmount('');
      setCat(''); 
    }
  }

  const combinedData = useMemo(() => {
    const formattedInv = invData.map(inv => ({
      ...inv,
      type: inv.action === 'jual' ? 'in' : 'out', 
      cat: 'Investasi', 
      desc: inv.name || (inv.action === 'jual' ? 'Jual Investasi' : 'Beli Investasi'),
      isInv: true 
    }));
    return [...txData, ...formattedInv];
  }, [txData, invData])

  const filtered = combinedData
    .filter(t => {
      const matchTab = filter === 'semua' || t.type === filter
      const matchMonth = selectedMonth ? t.date.startsWith(selectedMonth) : true
      const q = searchQuery.toLowerCase()
      const matchSearch = (t.desc && t.desc.toLowerCase().includes(q)) || (t.cat && t.cat.toLowerCase().includes(q))
      return matchTab && matchMonth && matchSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA; 
      return b.ts - a.ts; 
    })

  const groupedTx = useMemo(() => {
    const groups = {}
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = { items: [], totalIn: 0, totalOut: 0 }
      groups[t.date].items.push(t)
      if (t.type === 'in') groups[t.date].totalIn += t.amount
      if (t.type === 'out') groups[t.date].totalOut += t.amount
    })
    return groups
  }, [filtered])

  const monthlySummary = useMemo(() => {
    if (!selectedMonth) return { inMonth: totals.totalIn, outMonth: totals.totalOut };
    let inMonth = 0, outMonth = 0;
    combinedData.forEach(t => {
      if (t.date.startsWith(selectedMonth)) {
        if (t.type === 'in') inMonth += t.amount;
        if (t.type === 'out') outMonth += t.amount;
      }
    });
    return { inMonth, outMonth };
  }, [combinedData, selectedMonth, totals]);

  const getDayLabel = (dateStr) => {
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
      <h1 className="tabular-nums font-bold text-2xl text-text tracking-tight">Transaksi</h1>
      <p className="text-muted text-sm font-medium mt-1">Catat dan pantau arus kas harianmu.</p>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ── FORM PANEL ───────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-3 space-y-5 transition-colors">
          <PanelHeader title="Tambah Transaksi" />

          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => setType('in')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'in' ? 'bg-income-light text-income border-income/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowDownLeft size={18} strokeWidth={2.5} /> Pemasukan
            </button>
            <button onClick={() => setType('out')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'out' ? 'bg-gold-light text-gold border-gold/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowUpRight size={18} strokeWidth={2.5} /> Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Keterangan">
              {/* Note: Jika form input DescInput masih terang, beritahu saya! */}
              <DescInput value={desc} onChange={setDesc} txData={txData} onEnter={handleAdd} />
            </Field>

            <Field label="Jumlah (Rp)">
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10 transition-colors">
                  <Banknote size={16} strokeWidth={2.5} />
                </div>
                <input 
                  className="form-input pl-14 py-3 relative z-0" 
                  type="text" 
                  inputMode="numeric" 
                  value={amount ? Number(amount).toLocaleString('id-ID') : ''} 
                  onChange={e => setAmount(e.target.value.replace(/\D/g, ''))} 
                  placeholder="0" 
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} 
                />
              </div>

              {suggestedAmounts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5 animate-fade-in">
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider flex items-center mr-1">
                    Terakhir:
                  </span>
                  {suggestedAmounts.map((nominal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAmount(nominal.toString())}
                      className="px-2.5 py-1 bg-income-light text-income text-xs font-bold rounded-lg border border-income/20 hover:bg-income-light hover:text-income transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      {nominal.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
              )}
            </Field>

            {type === 'out' && (
              <Field label="Kategori">
                {/* Note: Jika pop-up CategoryInput masih terang, kita akan perbaiki di file komponennya nanti */}
                <CategoryInput value={cat} onChange={setCat} />
              </Field>
            )}

            <Field label="Pilih Dompet / Rekening">
              {totals?.walletBalances && totals.walletBalances.length > 0 ? (
                <div className="relative">
                  <div 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center pointer-events-none z-10 text-white"
                    style={{ backgroundColor: activeWallet?.color || '#94a3b8' }}
                  >
                    <Wallet size={16} strokeWidth={2.5} />
                  </div>
                  <select
                    className="form-input pl-14 pr-10 py-3 cursor-pointer appearance-none bg-transparent relative z-0 font-semibold text-text-2"
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
              <div className="relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-bg text-muted rounded-xl flex items-center justify-center pointer-events-none z-10 transition-colors">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
                <input className="form-input pl-14 py-3 cursor-pointer text-sm relative z-0" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </Field>
          </div>

          {err && <div className="text-xs text-expense bg-expense-light border border-expense/20 rounded-xl px-4 py-3 font-medium">{err}</div>}

          <button onClick={handleAdd} disabled={busy}
            className={`w-full py-4 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 mt-2 ${
              type === 'in' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />} Tambah Transaksi
          </button>
        </div>

        {/* ── QUICK STATS ──────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col transition-colors">
          <PanelHeader title={selectedMonth ? "Ringkasan Bulan Ini" : "Ringkasan Semua Waktu"} />
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <SummaryRow label="Pemasukan" value={fmt(monthlySummary.inMonth)} valueClass="text-income font-bold" />
            <SummaryRow label="Pengeluaran" value={fmt(monthlySummary.outMonth)} valueClass="text-gold font-bold" />
            <SummaryRow label="Investasi (Total)" value={fmt(Math.max(0, totals.invNet))} valueClass="text-invest font-bold" />
            
            <div className="mt-4 pt-5 border-t border-border flex justify-between items-center transition-colors">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-muted uppercase tracking-wider">Saldo Bersih</span>
                <span className="text-[10px] text-muted2 font-medium">(Semua Waktu)</span>
              </div>
              <span className={`tabular-nums font-black text-2xl tracking-tight ${totals.saldo >= 0 ? 'text-text' : 'text-expense'}`}>
                {fmt(totals.saldo)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIST RIWAYAT BUKU BESAR ────── */}
      <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm transition-colors">
        <PanelHeader title="Riwayat Transaksi" badge={`${filtered.length} total`} />
        
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={filter} onChange={setFilter} options={[
            { value: 'semua', label: 'Semua' },
            { value: 'in',    label: 'Pemasukan' },
            { value: 'out',   label: 'Pengeluaran' },
          ]} />
          
          {/* PEMILIH BULAN & TOMBOL SEMUA */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedMonth && (
              <button 
                onClick={() => setSelectedMonth('')}
                className="bg-bg hover:bg-border text-muted hover:text-text-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"
              >
                Semua
              </button>
            )}
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-field border border-border2 rounded-xl px-4 py-2.5 text-sm font-bold text-text-2 focus:border-income outline-none cursor-pointer hover:bg-bg transition-colors w-full sm:w-auto flex-1"
            />
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 z-10">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Cari transaksi berdasarkan nama atau kategori..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-field border border-border2 text-text placeholder:text-muted2 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:bg-surface outline-none transition-all relative z-0"
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedTx).length > 0 ? (
            Object.keys(groupedTx).map(dateKey => {
              const group = groupedTx[dateKey];
              const isToday = getDayLabel(dateKey) === "Hari Ini";
              
              return (
                <div key={dateKey} className="mb-8 last:mb-0 animate-fade-up">
                  <div className="flex items-center justify-between border-b-2 border-border pb-2.5 mb-3 sticky top-0 bg-surface z-10 transition-colors">
                    <h4 className={`font-bold text-sm ${isToday ? 'text-income' : 'text-text-2'}`}>
                      {getDayLabel(dateKey)}
                    </h4>
                    <div className="flex gap-4 text-[11px] font-bold uppercase tracking-wider">
                      {group.totalIn > 0 && <span className="text-income">+ {fmtShort(group.totalIn)}</span>}
                      {group.totalOut > 0 && <span className="text-gold">- {fmtShort(group.totalOut)}</span>}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    {group.items.map(t => (
                      <TxItem 
                        key={t.isInv ? `inv-${t.id}` : `tx-${t.id}`} 
                        t={t} 
                        onDelete={t.isInv ? undefined : deleteTx} 
                        isInv={t.isInv}
                        walletName={walletData?.find(w => w.id === t.wallet_id)?.name}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8">
              <Empty icon={<ReceiptText size={40} className="text-muted2 mb-3" strokeWidth={1} />} text={selectedMonth ? "Transaksi tidak ditemukan di bulan ini" : "Transaksi tidak ditemukan"} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
