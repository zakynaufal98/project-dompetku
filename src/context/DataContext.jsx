import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user }              = useAuth()
  const [txData,  setTxData]  = useState([])
  const [invData, setInvData] = useState([])
  const [billData, setBillData] = useState([])
  const [walletData, setWalletData] = useState([]) // STATE DOMPET
  const [loading, setLoading] = useState(false)

  // Modifikasi mapTx untuk menangkap wallet_id
  const mapTx = (r) => ({
    id: r.id, desc: r.keterangan, amount: parseFloat(r.amount),
    type: r.tipe, cat: r.cat, date: r.tgl,
    wallet_id: r.wallet_id, // PENAMBAHAN RELASI DOMPET
    ts: new Date(r.created_at).getTime(),
  })

  const mapInv = (r) => ({
    id: r.id, invType: r.inv_type, subType: r.sub_type || '',
    desc: r.keterangan, amount: parseFloat(r.amount),
    action: r.action, unit: r.unit || '', qty: parseFloat(r.qty || 0),
    date: r.tgl, 
    wallet_id: r.wallet_id, // Tambahkan ini
    ts: new Date(r.created_at).getTime(),
  })

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    // FETCH 4 TABEL SEKALIGUS (Termasuk wallets)
    const [txRes, invRes, billRes, walletRes] = await Promise.all([
      supabase.from('transaksi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }),
      supabase.from('investasi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }),
      supabase.from('tagihan').select('*').eq('user_id', user.id).order('jatuh_tempo', { ascending: true }),
      supabase.from('wallets').select('*').eq('user_id', user.id).order('created_at', { ascending: true }) // Fetch Dompet
    ])
    
    if (!txRes.error)  setTxData((txRes.data  || []).map(mapTx))
    if (!invRes.error) setInvData((invRes.data  || []).map(mapInv))
    if (!billRes.error) setBillData(billRes.data || [])
    if (!walletRes.error) setWalletData(walletRes.data || []) // Simpan data dompet
    
    setLoading(false)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  // --- FUNGSI DOMPET (BARU) ---
  const addWallet = async ({ name, balance, color }) => {
    const { data, error } = await supabase.from('wallets')
      .insert({ user_id: user.id, name, balance, color })
      .select().single()
    if (!error) setWalletData(prev => [...prev, data])
    return error
  }

  const updateWallet = async (id, { name, balance, color }) => {
    const { data, error } = await supabase.from('wallets')
      .update({ name, balance, color })
      .eq('id', id).eq('user_id', user.id)
      .select().single()
    if (!error) setWalletData(prev => prev.map(w => w.id === id ? data : w))
    return error
  }

  const deleteWallet = async (id) => {
    const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setWalletData(prev => prev.filter(w => w.id !== id))
    return error
  }

  // --- FUNGSI TRANSAKSI KAS ---
  // Ditambahkan parameter wallet_id
  const addTx = async ({ desc, amount, type, cat, date, wallet_id = null }) => {
    const { data, error } = await supabase.from('transaksi')
      .insert({ user_id: user.id, keterangan: desc, amount, tipe: type, cat, tgl: date, wallet_id })
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
// 2. Update addInv (Sekitar baris 84)
  const addInv = async ({ invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    const { data, error } = await supabase.from('investasi')
      .insert({ user_id: user.id, inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id })
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

  // --- FUNGSI TAGIHAN ---
  const addBill = async ({ nama_tagihan, amount, jatuh_tempo }) => {
    const { data, error } = await supabase.from('tagihan')
      .insert({ user_id: user.id, nama_tagihan, amount, jatuh_tempo })
      .select().single()
    if (!error) {
      setBillData(prev => [...prev, data].sort((a,b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo)))
    }
    return error
  }

  const toggleBill = async (id, currentStatus) => {
    const isLunasNow = !currentStatus;
    
    const { error } = await supabase.from('tagihan')
      .update({ is_lunas: isLunasNow })
      .eq('id', id).eq('user_id', user.id)

    if (!error) {
      setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: isLunasNow } : b))

      if (isLunasNow) {
        const bill = billData.find(b => b.id === id);
        if (bill) {
          const today = new Date().toISOString().split('T')[0];
          await addTx({
            desc: `Bayar Tagihan: ${bill.nama_tagihan}`,
            amount: Number(bill.amount),
            type: 'out',
            cat: 'Tagihan',
            date: today,
            wallet_id: null 
          });

          const dateObj = new Date(bill.jatuh_tempo);
          dateObj.setMonth(dateObj.getMonth() + 1);
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

  // --- PERHITUNGAN TOTAL SALDO & DOMPET ---
  const totals = useMemo(() => {
    const totalIn = txData.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
    const totalOut = txData.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)
    const invBuy = invData.filter(t => t.action === 'beli').reduce((s, t) => s + t.amount, 0)
    const invSell = invData.filter(t => t.action === 'jual').reduce((s, t) => s + t.amount, 0)

    const saldo = (totalIn + invSell) - (totalOut + invBuy)
    const invNet = invBuy - invSell

  
// 3. Update logika totals (Sangat Penting!)
  const walletBalances = walletData.map(w => {
    const wTxs = txData.filter(t => t.wallet_id === w.id);
    const wIn = wTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
    const wOut = wTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
    
    // TAMBAHAN: Hitung arus kas dari Investasi untuk dompet ini
    const wInvs = invData.filter(i => i.wallet_id === w.id);
    const invJual = wInvs.filter(i => i.action === 'jual').reduce((s, i) => s + i.amount, 0);
    const invBeli = wInvs.filter(i => i.action === 'beli').reduce((s, i) => s + i.amount, 0);
    
    return {
      ...w,
      // Rumus: Saldo Awal + (Masuk + Jual) - (Keluar + Beli)
      calculatedBalance: (Number(w.balance) || 0) + (wIn + invJual) - (wOut + invBeli)
    };
  });

    return {
      totalIn,
      totalOut,
      invBuy,
      invSell,
      invNet,
      saldo,
      walletBalances 
    }
  }, [txData, invData, walletData])

  return (
    <DataContext.Provider value={{ 
      txData, invData, billData, walletData, loading, loadAll, 
      addWallet, updateWallet, deleteWallet,
      addTx, deleteTx, addInv, deleteInv, 
      addBill, toggleBill, deleteBill, totals 
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)