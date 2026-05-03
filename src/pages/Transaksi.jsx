import { useState, useMemo, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, today, CATEGORY_TREE } from '../lib/utils'
import { TxItem, Empty, Tabs, Field, PanelHeader, SummaryRow } from '../components/UI'
import DescInput from '../components/DescInput'
import RecurringWidget from '../components/RecurringWidget'
import { 
  ArrowDownLeft, ArrowUpRight, Banknote, 
  Calendar, PlusCircle, ReceiptText, Loader2, Search,
  Wallet, ChevronDown, Sparkles, BriefcaseBusiness, ArrowUpDown
} from 'lucide-react'

export default function Transaksi() {
  // 👇 PERBAIKAN 1: Tidak perlu memanggil invData lagi, karena txData sudah memuat seluruh arus mutasi kas
  const { txData, addTx, deleteTx, totals, walletData } = useData() 
  
  const [type,    setType]   = useState('out')
  const [desc,    setDesc]   = useState('')
  const [amount,  setAmount] = useState('')
  
  const [mainCat, setMainCat] = useState('')
  const [subCat,  setSubCat]  = useState('')
  
  const [date,    setDate]   = useState(today())
  const [walletId, setWalletId] = useState('') 
  
  const [filter, setFilter] = useState('semua')
  const [busy,    setBusy]   = useState(false)
  const [err,     setErr]    = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(today().substring(0, 7)) 
  const [sortBy, setSortBy] = useState('terbaru')

  useEffect(() => {
    if (walletData && walletData.length > 0 && !walletId) {
      setWalletId(walletData[0].id)
    }
  }, [walletData, walletId])

  // ==========================================
  // ✨ LOGIKA SMART AUTO-CATEGORIZATION ✨
  // ==========================================
  const handleDescChange = (val) => {
    setDesc(val);
    if (val.trim().length > 2) {
      const pastMatch = txData.find(t => t.desc && t.desc.toLowerCase() === val.trim().toLowerCase());
      
      if (pastMatch && pastMatch.cat) {
        setType(pastMatch.type); 
        setMainCat(pastMatch.cat);
        setSubCat(pastMatch.sub_cat || '');
      }
    }
  }

  const handleTypeChange = (newType) => {
    setType(newType);
    setMainCat('');
    setSubCat('');
  }

  const suggestedAmounts = useMemo(() => {
    if (!desc.trim()) return [];
    const matches = txData.filter(t => t.desc && t.desc.toLowerCase() === desc.trim().toLowerCase() && t.type === type);
    const uniqueAmounts = [...new Set(matches.map(t => t.amount))];
    return uniqueAmounts.slice(0, 3);
  }, [desc, txData, type]);

  const availableMainCats = Object.keys(CATEGORY_TREE[type] || {});
  const availableSubCats = mainCat && CATEGORY_TREE[type]?.[mainCat] ? CATEGORY_TREE[type][mainCat] : [];

  const handleAdd = async () => {
    if (!desc.trim())       { setErr('Keterangan wajib diisi'); return }
    if (!amount||+amount<=0){ setErr('Jumlah harus lebih dari 0'); return }
    if (!mainCat)           { setErr('Kategori Induk wajib dipilih'); return }
    if (availableSubCats.length > 0 && !subCat) { setErr('Sub kategori wajib dipilih'); return }
    
    setBusy(true); setErr('')
    
    const finalCategory = subCat ? `${mainCat} - ${subCat}` : mainCat;
    
    const e = await addTx({ 
      desc: desc.trim(), 
      amount: +amount, 
      type, 
      cat: mainCat,        // Induk masuk ke kolom cat
      sub_cat: subCat,     // Anak masuk ke kolom sub_cat
      date,
      wallet_id: walletId || null 
    })
    
    setBusy(false)
    
    if (e) setErr(e.message)
    else { 
      setDesc(''); 
      setAmount('');
      setMainCat(''); 
      setSubCat('');
    }
  }

  // 👇 PERBAIKAN 2: Menggunakan Filter pada txData saja
  const filtered = txData
    .filter(t => {
      const matchTab = filter === 'semua' || t.type === filter
      const matchMonth = selectedMonth ? t.date.startsWith(selectedMonth) : true
      const q = searchQuery.toLowerCase()
      const matchSearch = (t.desc && t.desc.toLowerCase().includes(q)) || (t.cat && t.cat.toLowerCase().includes(q))
      return matchTab && matchMonth && matchSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'terlama':
          return new Date(a.date).getTime() - new Date(b.date).getTime() || a.ts - b.ts;
        case 'terbesar':
          return b.amount - a.amount;
        case 'terkecil':
          return a.amount - b.amount;
        case 'az':
          return (a.desc || '').localeCompare(b.desc || '', 'id');
        case 'za':
          return (b.desc || '').localeCompare(a.desc || '', 'id');
        default: // terbaru
          return new Date(b.date).getTime() - new Date(a.date).getTime() || b.ts - a.ts;
      }
    })

  const groupedTx = useMemo(() => {
    const groups = {}
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = { items: [], totalIn: 0, totalOut: 0 }
      groups[t.date].items.push(t)
      
      // LOGIKA MURNI: Jangan hitung Transfer di Pemasukan/Pengeluaran Harian
      if (t.cat !== 'Transfer' && !(t.cat && t.cat.startsWith('Transfer'))) {
        if (t.type === 'in') groups[t.date].totalIn += t.amount
        if (t.type === 'out') groups[t.date].totalOut += t.amount
      }
    })
    return groups
  }, [filtered])

  // 👇 PERBAIKAN 3: Perhitungan Murni (Mengabaikan Transfer untuk Ringkasan)
  const monthlySummary = useMemo(() => {
    let inMonth = 0, outMonth = 0;
    txData.forEach(t => {
      if (selectedMonth && !t.date.startsWith(selectedMonth)) return;
      
      // LOGIKA MURNI: Jangan hitung Transfer di Pemasukan/Pengeluaran
      if (t.cat !== 'Transfer' && !(t.cat && t.cat.startsWith('Transfer'))) {
        if (t.type === 'in') inMonth += t.amount;
        if (t.type === 'out') outMonth += t.amount;
      }
    });
    return { inMonth, outMonth };
  }, [txData, selectedMonth]);

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
            <button onClick={() => handleTypeChange('in')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'in' ? 'bg-income-light text-income border-income/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowDownLeft size={18} strokeWidth={2.5} /> Pemasukan
            </button>
            <button onClick={() => handleTypeChange('out')}
              className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                type === 'out' ? 'bg-gold-light text-gold border-gold/30' : 'bg-bg text-muted border-transparent hover:border-border2'
              }`}>
              <ArrowUpRight size={18} strokeWidth={2.5} /> Pengeluaran
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Keterangan / Tempat">
              <DescInput value={desc} onChange={handleDescChange} txData={txData} onEnter={handleAdd} />
              <p className="text-[9px] text-income font-bold flex items-center mt-1.5 uppercase tracking-widest opacity-80">
                <Sparkles size={10} className="mr-1" /> Auto-Kategori Aktif
              </p>
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

            <Field label="Kategori Induk">
              <div className="relative">
                <select 
                  className="form-input py-3 pl-4 pr-10 cursor-pointer appearance-none relative z-0 font-semibold text-text-2 text-sm w-full"
                  value={mainCat}
                  onChange={(e) => {
                    setMainCat(e.target.value);
                    setSubCat('');
                  }}
                >
                  <option value="" disabled>Pilih Kategori...</option>
                  {availableMainCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} strokeWidth={2.5} />
                </div>
              </div>
            </Field>

            <Field label="Sub Kategori">
              <div className="relative">
                <select 
                  className="form-input py-3 pl-4 pr-10 cursor-pointer appearance-none relative z-0 font-semibold text-text-2 text-sm w-full disabled:opacity-50"
                  value={subCat}
                  onChange={(e) => setSubCat(e.target.value)}
                  disabled={!mainCat || availableSubCats.length === 0}
                >
                  <option value="" disabled>Pilih Detail...</option>
                  {availableSubCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} strokeWidth={2.5} />
                </div>
              </div>
            </Field>

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
                    className="form-input pl-14 pr-10 py-3 cursor-pointer appearance-none relative z-0 font-semibold text-text-2"
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
              type === 'in' ? 'bg-income hover:opacity-90' : 'bg-expense hover:opacity-90'
            }`}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />} Simpan Transaksi
          </button>
        </div>

        {/* ── QUICK STATS ──────────────────────────────── */}
        <div className="bg-surface border border-border rounded-[24px] p-6 md:p-8 shadow-sm lg:col-span-2 flex flex-col transition-colors">
          <PanelHeader title={selectedMonth ? "Ringkasan Bulan Ini" : "Ringkasan Semua Waktu"} />
          
          <div className="mt-2 space-y-3.5">
            <div className="bg-income/5 border border-income/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-income/10 hover:border-income/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-income-light text-income flex items-center justify-center shadow-inner">
                  <ArrowDownLeft size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pemasukan</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Murni</span>
                </div>
              </div>
              <span className="text-income font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.inMonth)}</span>
            </div>

            <div className="bg-gold/5 border border-gold/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-gold/10 hover:border-gold/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gold-light text-gold flex items-center justify-center shadow-inner">
                  <ArrowUpRight size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Pengeluaran</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Murni</span>
                </div>
              </div>
              <span className="text-gold font-black text-lg md:text-xl tracking-tight">{fmt(monthlySummary.outMonth)}</span>
            </div>

            <div className="bg-invest/5 border border-invest/10 rounded-[20px] p-4 flex justify-between items-center transition-all hover:bg-invest/10 hover:border-invest/20">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-invest-light text-invest flex items-center justify-center shadow-inner">
                  <BriefcaseBusiness size={22} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text">Investasi</span>
                  <span className="text-[10px] font-bold text-muted2 uppercase tracking-wider">Total</span>
                </div>
              </div>
              <span className="text-invest font-black text-lg md:text-xl tracking-tight">{fmt(Math.max(0, totals.invNet))}</span>
            </div>
            
            <div className="mt-6 flex flex-col items-center justify-center bg-bg/50 border border-border2 rounded-[24px] p-6 shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-income via-invest to-gold"></div>
               <span className="text-[11px] font-bold text-muted uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Wallet size={12} /> Saldo Bersih Keseluruhan
               </span>
               <span className={`tabular-nums font-black text-3xl md:text-4xl tracking-tight ${totals.saldo >= 0 ? 'text-text' : 'text-expense'}`}>
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
          
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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
              className="bg-field border border-border2 rounded-xl px-4 py-2.5 text-sm font-bold text-text-2 focus:border-income outline-none cursor-pointer hover:bg-bg transition-colors flex-1 min-w-[140px]"
            />
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 z-10 pointer-events-none">
                <ArrowUpDown size={14} />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-field border border-border2 rounded-xl pl-8 pr-8 py-2.5 text-sm font-bold text-text-2 focus:border-income outline-none cursor-pointer hover:bg-bg transition-colors appearance-none"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                <option value="terbesar">Terbesar</option>
                <option value="terkecil">Terkecil</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted2">
                <ChevronDown size={14} />
              </div>
            </div>
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
                        key={`tx-${t.id}`} 
                        t={t} 
                        onDelete={deleteTx} 
                        isInv={false} // Selalu false, karena tabel transaksi sudah memuat mutasi investasi & hutang
                        walletName={walletData?.find(w => w.id === t.wallet_id)?.name}
                        inputterName={t.created_by_email || null}
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

      {/* Transaksi Berulang */}
      <RecurringWidget />

    </div>
  )
}