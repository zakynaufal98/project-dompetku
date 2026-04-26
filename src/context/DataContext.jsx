import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user }              = useAuth()
  const [txData,  setTxData]  = useState([])
  const [invData, setInvData] = useState([])
  const [billData, setBillData] = useState([]) // STATE BARU UNTUK TAGIHAN
  const [loading, setLoading] = useState(false)

  const mapTx = (r) => ({
    id: r.id, desc: r.keterangan, amount: parseFloat(r.amount),
    type: r.tipe, cat: r.cat, date: r.tgl,
    ts: new Date(r.created_at).getTime(),
  })

  const mapInv = (r) => ({
    id: r.id, invType: r.inv_type, subType: r.sub_type || '',
    desc: r.keterangan, amount: parseFloat(r.amount),
    action: r.action, unit: r.unit || '', qty: parseFloat(r.qty || 0),
    date: r.tgl, ts: new Date(r.created_at).getTime(),
  })

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    // FETCH 3 TABEL SEKALIGUS
    const [txRes, invRes, billRes] = await Promise.all([
      supabase.from('transaksi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }),
      supabase.from('investasi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }),
      supabase.from('tagihan').select('*').eq('user_id', user.id).order('jatuh_tempo', { ascending: true }) // Urutkan dari yang paling dekat
    ])
    
    if (!txRes.error)  setTxData((txRes.data  || []).map(mapTx))
    if (!invRes.error) setInvData((invRes.data  || []).map(mapInv))
    if (!billRes.error) setBillData(billRes.data || []) // Simpan data tagihan
    
    setLoading(false)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  // --- FUNGSI TRANSAKSI KAS ---
  const addTx = async ({ desc, amount, type, cat, date }) => {
    const { data, error } = await supabase.from('transaksi')
      .insert({ user_id: user.id, keterangan: desc, amount, tipe: type, cat, tgl: date })
      .select().single()
    if (error) return error
    setTxData(prev => [mapTx(data), ...prev])
    return null
  }

  const deleteTx = async (id) => {
    const { error } = await supabase.from('transaksi').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setTxData(prev => prev.filter(t => t.id !== id))
    return error
  }

  // --- FUNGSI INVESTASI ---
  const addInv = async ({ invType, subType, desc, amount, action, unit, qty, date }) => {
    const { data, error } = await supabase.from('investasi')
      .insert({ user_id: user.id, inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date })
      .select().single()
    if (error) return error
    setInvData(prev => [mapInv(data), ...prev])
    return null
  }

  const deleteInv = async (id) => {
    const { error } = await supabase.from('investasi').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setInvData(prev => prev.filter(t => t.id !== id))
    return error
  }

  // --- FUNGSI TAGIHAN (BARU) ---
  const addBill = async ({ nama_tagihan, amount, jatuh_tempo }) => {
    const { data, error } = await supabase.from('tagihan')
      .insert({ user_id: user.id, nama_tagihan, amount, jatuh_tempo })
      .select().single()
    if (!error) {
      setBillData(prev => [...prev, data].sort((a,b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo)))
    }
    return error
  }

  // --- FUNGSI CENTANG TAGIHAN (DENGAN SIHIR GANDA) ---
  const toggleBill = async (id, currentStatus) => {
    const isLunasNow = !currentStatus; // Status baru (True = Lunas)
    
    // 1. Update status tagihan di database
    const { error } = await supabase.from('tagihan')
      .update({ is_lunas: isLunasNow })
      .eq('id', id).eq('user_id', user.id)

    if (!error) {
      // Update tampilan layar
      setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: isLunasNow } : b))

      // SIHIR GANDA: Hanya jalan jika dicentang LUNAS (bukan saat di-uncheck)
      if (isLunasNow) {
        // Cari data lengkap tagihan ini
        const bill = billData.find(b => b.id === id);
        if (bill) {
          
          // Sihir 1: Auto-Catat Pengeluaran Kas (Saldo Otomatis Berkurang!)
          const today = new Date().toISOString().split('T')[0]; // Tanggal hari ini
          await addTx({
            desc: `Bayar Tagihan: ${bill.nama_tagihan}`,
            amount: Number(bill.amount),
            type: 'out', // Uang keluar
            cat: 'Tagihan', // Masuk kategori Tagihan
            date: today
          });

          // Sihir 2: Auto-Renew untuk Bulan Depan
          const dateObj = new Date(bill.jatuh_tempo);
          dateObj.setMonth(dateObj.getMonth() + 1); // Tambah 1 bulan
          const nextMonthDate = dateObj.toISOString().split('T')[0];

          await addBill({
            nama_tagihan: bill.nama_tagihan,
            amount: Number(bill.amount),
            jatuh_tempo: nextMonthDate
          });
        }
      }
    }
  }

  const deleteBill = async (id) => {
    const { error } = await supabase.from('tagihan').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setBillData(prev => prev.filter(b => b.id !== id))
  }

  // --- PERHITUNGAN TOTAL SALDO ---
  const totals = useMemo(() => {
    const totalIn = txData.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
    const totalOut = txData.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
    const invBuy = invData.filter(t => t.action === 'beli').reduce((s, t) => s + t.amount, 0)
    const invSell = invData.filter(t => t.action === 'jual').reduce((s, t) => s + t.amount, 0)

    // Saldo = (Semua Pemasukan Kas) - (Semua Pengeluaran Kas)
    const saldo = (totalIn + invSell) - (totalOut + invBuy)
    
    // Nilai aset investasi yang masih tertahan (belum dijual)
    const invNet = invBuy - invSell

    return {
      totalIn,
      totalOut,
      invBuy,
      invSell,
      invNet,
      saldo
    }
  }, [txData, invData])

  return (
    // JANGAN LUPA: Tambahkan fungsi dan state tagihan ke dalam provider ini
    <DataContext.Provider value={{ 
      txData, invData, billData, loading, loadAll, 
      addTx, deleteTx, addInv, deleteInv, 
      addBill, toggleBill, deleteBill, totals 
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)