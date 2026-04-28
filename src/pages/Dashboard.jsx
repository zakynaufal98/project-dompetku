import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'
import { useData } from '../context/DataContext'
import { fmt, fmtShort, MONTHS, CHART_COLORS } from '../lib/utils'
import { Empty, Spinner, DonutLegend, BankLogo } from '../components/UI'
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, Plus, Trash2 } from 'lucide-react'
import BillTracker from '../components/BillTracker'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-lg">
      <p className="text-slate-500 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums font-bold text-slate-800">
          {p.name}: <span style={{ color: p.color }}>{fmtShort(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { txData, invData, loading, totals, addWallet, updateWallet, deleteWallet } = useData() 
  const now = new Date()
  
  // 1. HITUNGAN SPESIFIK BULAN INI & BULAN LALU
  const { currIn, currOut, trends } = useMemo(() => {
    const currYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYM = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

    const cInTx = txData.filter(t => t.type === 'in' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cInInv = invData.filter(t => t.action === 'jual' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cIn = cInTx + cInInv
    
    const cOutTx = txData.filter(t => t.type === 'out' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOutInv = invData.filter(t => t.action === 'beli' && t.date?.startsWith(currYM)).reduce((s, t) => s + t.amount, 0)
    const cOut = cOutTx + cOutInv

    const lInTx = txData.filter(t => t.type === 'in' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lInInv = invData.filter(t => t.action === 'jual' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lIn = lInTx + lInInv

    const lOutTx = txData.filter(t => t.type === 'out' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lOutInv = invData.filter(t => t.action === 'beli' && t.date?.startsWith(lastYM)).reduce((s, t) => s + t.amount, 0)
    const lOut = lOutTx + lOutInv

    const currSaldo = totals.saldo
    const lastSaldo = currSaldo - cIn + cOut

    const calcPct = (curr, last) => {
      if (last === 0) return curr > 0 ? 100 : 0
      return ((curr - last) / last) * 100
    }

    return {
      currIn: cIn,
      currOut: cOut,
      trends: {
        saldo: calcPct(currSaldo, lastSaldo),
        masuk: calcPct(cIn, lIn),
        keluar: calcPct(cOut, lOut)
      }
    }
  }, [txData, invData, totals.saldo, now])

  // 2. HITUNGAN SPESIFIK HARI INI
  const todayOut = useMemo(() => {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tOutTx = txData.filter(t => t.type === 'out' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    const tOutInv = invData.filter(t => t.action === 'beli' && t.date === todayStr).reduce((s, t) => s + t.amount, 0);
    return tOutTx + tOutInv;
  }, [txData, invData, now]);

  // 3. DATA GRAFIK 6 BULAN
  const tren6 = useMemo(() => Array.from({length: 6}, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return {
      name:   MONTHS[d.getMonth()],
      Pemasukan:  txData.filter(t => t.type === 'in' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0),
      Pengeluaran: txData.filter(t => t.type === 'out' && t.date?.startsWith(key)).reduce((s,t) => s + t.amount, 0),
    }
  }), [txData, now])

  // 4. DATA DONUT CHART KATEGORI
  const currYM = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const catOut = useMemo(() => {
    const m = {}
    txData.filter(t => t.type === 'out' && t.date?.startsWith(currYM))
      .forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount })
    return m
  }, [txData, currYM])

  const donutData = Object.entries(catOut).filter(([,v]) => v > 0)
    .sort((a,b) => b[1] - a[1])
    .map(([name, value], i) => ({name, value, fill: CHART_COLORS[i]}))

  const renderTrendBadge = (pct, isExpense = false) => {
    if (pct === 0) return <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-md font-bold text-[11px] tracking-wide">0%</span>
    const isPositive = pct > 0
    const isGood = isExpense ? !isPositive : isPositive 
    const colorClass = isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
      <span className={`${colorClass} flex items-center font-bold px-2 py-1 rounded-md text-[11px] tracking-wide`}>
        <Icon size={14} className="mr-1 stroke-[3px]" />
        {isPositive ? '+' : ''}{pct.toFixed(1)}%
      </span>
    )
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="tabular-nums font-bold text-2xl text-slate-800 tracking-tight">Overview</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Selamat datang kembali, mari pantau keuanganmu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD SALDO TOTAL */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Saldo Saat Ini</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Total</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#2F3241] tracking-tight truncate">{fmt(totals.saldo)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.saldo, false)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* CARD PENGELUARAN HARI INI */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-600 rounded-[24px] p-6 shadow-sm flex flex-col justify-between text-white transform transition-transform hover:-translate-y-1">
          <div className="flex justify-between items-start mb-4">
            <span className="font-semibold text-base text-indigo-50">Keluar Hari Ini</span>
            <span className="text-[11px] font-bold bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider text-white">HARI INI</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl tracking-tight truncate">
              {todayOut > 0 ? `-${fmt(todayOut)}` : 'Rp 0'}
            </p>
            <div className="mt-3 text-[13px] font-medium text-indigo-100 flex items-center gap-1.5">
              {todayOut === 0 ? '✨ Hebat! Belum jajan hari ini' : '👀 Tetap pantau dompetmu!'}
            </div>
          </div>
        </div>

        {/* CARD PENGELUARAN BULAN INI */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Pengeluaran</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#FF8A00] tracking-tight truncate">{currOut > 0 ? `-${fmt(currOut)}` : fmt(currOut)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.keluar, true)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>

        {/* CARD PEMASUKAN BULAN INI */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-800 font-semibold text-base">Pemasukan</span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
          </div>
          <div>
            <p className="tabular-nums font-bold text-3xl xl:text-4xl text-[#10B981] tracking-tight truncate">{currIn > 0 ? `+${fmt(currIn)}` : fmt(currIn)}</p>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {renderTrendBadge(trends.masuk, false)}
              <span className="text-slate-400 text-xs font-medium">vs bln lalu</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- WIDGET DOMPET & REKENING --- */}
      <WalletWidget totals={totals} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={deleteWallet} />

      {/* --- GRID UTAMA BAWAH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KIRI: CHART KEUANGAN */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Total Keuangan (6 Bulan)</h3>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tren6} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A00" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF8A00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                <YAxis width={85} tickFormatter={fmtShort} tick={{fontSize:12, fill:'#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Pemasukan" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="Pengeluaran" stroke="#FF8A00" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3.5 h-3.5 rounded-full bg-[#4F46E5]" />Pemasukan
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF8A00]" />Pengeluaran
            </div>
          </div>
        </div>

        {/* KANAN: STACK TAGIHAN & DONUT CHART */}
        <div className="flex flex-col gap-6">
          <BillTracker />
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800">Total Pengeluaran</h3>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider">Bulan Ini</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {donutData.length > 0 ? (
                <>
                  <div className="relative h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                          {donutData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip formatter={v => fmtShort(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total</span>
                      <span className="tabular-nums font-bold text-2xl text-[#FF8A00] tracking-tight">{fmtShort(currOut)}</span>
                    </div>
                  </div>
                  <div className="mt-4"><DonutLegend data={catOut} /></div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <PieChartIcon size={48} className="text-slate-300 mb-3" strokeWidth={1} />
                  <p className="text-sm text-slate-400 font-medium">Belum ada pengeluaran</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// KOMPONEN WIDGET DOMPET (DENGAN FITUR EDIT & HAPUS IN-APP)
// ---------------------------------------------------------
function WalletWidget({ totals, addWallet, updateWallet, deleteWallet }) {
  const [showModal, setShowModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false) // State baru untuk Konfirmasi Hapus
  const [editId, setEditId] = useState(null) 
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState('#4F46E5') 
  const [busy, setBusy] = useState(false)

  const handleOpenNew = () => {
    setEditId(null); setName(''); setBalance(''); setColor('#4F46E5'); 
    setShowConfirmDelete(false); // Reset konfirmasi
    setShowModal(true);
  }

  const handleOpenEdit = (w) => {
    setEditId(w.id); setName(w.name); setBalance(w.balance || 0); setColor(w.color || '#4F46E5'); 
    setShowConfirmDelete(false); // Reset konfirmasi
    setShowModal(true);
  }

  const handleSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    
    const payload = { 
      name: name.trim(), 
      balance: balance ? Number(balance) : 0, 
      color 
    };

    if (editId) {
      await updateWallet(editId, payload);
    } else {
      await addWallet(payload);
    }

    setBusy(false);
    setShowModal(false);
  }

  // Hanya mengubah tampilan ke mode konfirmasi
  const triggerDelete = () => {
    setShowConfirmDelete(true);
  }

  // Eksekusi penghapusan sesungguhnya
  const executeDelete = async () => {
    setBusy(true);
    await deleteWallet(editId);
    setBusy(false);
    setShowConfirmDelete(false);
    setShowModal(false);
  }

  const COLORS = ['#4F46E5', '#10B981', '#FF8A00', '#E11D48', '#06B6D4', '#8B5CF6', '#1E293B', '#F43F5E'];

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dompet & Rekening</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-stretch">
        
        {totals?.walletBalances?.map(w => (
          <div 
            key={w.id} 
            onClick={() => handleOpenEdit(w)}
            className="min-w-[180px] p-5 rounded-[20px] bg-white border border-slate-200 shadow-sm flex-shrink-0 flex flex-col justify-between relative overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: w.color || '#ccc' }} />
            <div>
              <div className="flex items-center gap-2 mb-2 mt-1">
                <BankLogo name={w.name} size="sm" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{w.name}</p>
              </div>
              <h3 className="text-xl font-black text-slate-800 tabular-nums">{fmt(w.calculatedBalance)}</h3>
            </div>
            
            <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
          </div>
        ))}

        <button 
          onClick={handleOpenNew}
          className="min-w-[140px] p-5 rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex-shrink-0"
        >
          <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 text-inherit">
            <Plus size={16} strokeWidth={3} />
          </span>
          <span className="text-xs font-bold">Tambah Baru</span>
        </button>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-fade-up">
            
            {showConfirmDelete ? (
              // TAMPILAN KONFIRMASI HAPUS
              <div className="animate-fade-in text-center py-2">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Hapus Dompet Ini?</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Transaksi yang sudah tercatat menggunakan dompet ini <b>tidak akan hilang</b>, namun riwayat dompet pada transaksi tersebut akan dikosongkan.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmDelete(false)} disabled={busy} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Batal
                  </button>
                  <button onClick={executeDelete} disabled={busy} className="flex-1 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors">
                    {busy ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            ) : (
              // TAMPILAN FORM EDIT/TAMBAH
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-slate-800">
                    {editId ? 'Edit Dompet' : 'Tambah Dompet Baru'}
                  </h3>
                  {editId && (
                    <button onClick={triggerDelete} className="w-8 h-8 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-colors" title="Hapus Dompet">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Dompet (Mis: BCA, Kas, OVO)</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" placeholder="Masukkan nama..." />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Saldo Awal (Rp)</label>
                    <input type="text" inputMode="numeric" value={balance ? Number(balance).toLocaleString('id-ID') : ''} onChange={e => setBalance(e.target.value.replace(/\D/g, ''))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none tabular-nums" placeholder="0" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Warna Kartu</label>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                    <button onClick={handleSave} disabled={busy || !name} className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {editId ? 'Simpan Perubahan' : 'Simpan Dompet'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}