import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user }              = useAuth()
  const [txData,  setTxData]  = useState([])
  const [invData, setInvData] = useState([])
  const [billData, setBillData] = useState([])
  const [walletData, setWalletData] = useState([]) 
  const [loading, setLoading] = useState(false)

  const mapTx = (r) => ({
    id: r.id, desc: r.keterangan, amount: parseFloat(r.amount),
    type: r.tipe, cat: r.cat, date: r.tgl,
    wallet_id: r.wallet_id, 
    ts: new Date(r.created_at).getTime(),
  })

  const mapInv = (r) => ({
    id: r.id, invType: r.inv_type, subType: r.sub_type || '',
    desc: r.keterangan, amount: parseFloat(r.amount),
    action: r.action, unit: r.unit || '', qty: parseFloat(r.qty || 0),
    date: r.tgl, 
    wallet_id: r.wallet_id,
    ts: new Date(r.created_at).getTime(),
  })

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    const [txRes, invRes, billRes, walletRes] = await Promise.all([
      // PERBAIKAN: Diurutkan secara ganda (Tanggal lalu Waktu dibuat) agar akurat
      supabase.from('transaksi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('investasi').select('*').eq('user_id', user.id).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('tagihan').select('*').eq('user_id', user.id).order('jatuh_tempo', { ascending: true }),
      supabase.from('wallets').select('*').eq('user_id', user.id).order('created_at', { ascending: true }) 
    ])
    
    if (!txRes.error)  setTxData((txRes.data  || []).map(mapTx))
    if (!invRes.error) setInvData((invRes.data  || []).map(mapInv))
    if (!billRes.error) setBillData(billRes.data || [])
    if (!walletRes.error) setWalletData(walletRes.data || []) 
    
    setLoading(false)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  const addWallet = async ({ name, balance, color }) => {
    const { data, error } = await supabase.from('wallets').insert({ user_id: user.id, name, balance, color }).select().single()
    if (!error) setWalletData(prev => [...prev, data])
    return error
  }
  const updateWallet = async (id, { name, balance, color }) => {
    const { data, error } = await supabase.from('wallets').update({ name, balance, color }).eq('id', id).eq('user_id', user.id).select().single()
    if (!error) setWalletData(prev => prev.map(w => w.id === id ? data : w))
    return error
  }
  const deleteWallet = async (id) => {
    const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setWalletData(prev => prev.filter(w => w.id !== id))
    return error
  }

  const addTx = async ({ desc, amount, type, cat, date, wallet_id = null }) => {
    const { data, error } = await supabase.from('transaksi').insert({ user_id: user.id, keterangan: desc, amount, tipe: type, cat, tgl: date, wallet_id }).select().single()
    if (error) return error
    setTxData(prev => [mapTx(data), ...prev])
    return null
  }
  const deleteTx = async (id) => {
    const { error } = await supabase.from('transaksi').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setTxData(prev => prev.filter(t => t.id !== id))
    return error
  }

  const validateSellInvestment = (invType, subType, amount, qty, excludeId = null) => {
    let availableQty = 0; let availableAmount = 0;
    invData.filter(t => t.subType === subType && t.id !== excludeId).forEach(t => {
      if (t.action === 'beli') { availableQty += (t.qty || 0); availableAmount += t.amount; } 
      else { availableQty -= (t.qty || 0); availableAmount -= t.amount; }
    });
    availableQty = Number(availableQty.toFixed(4));

    if (invType !== 'Uang') {
      if (availableQty <= 0) return new Error(`Anda belum memiliki portofolio ${subType} untuk dijual.`);
      if (qty > availableQty) return new Error(`Saldo aset tidak cukup! Maksimal yang bisa dijual: ${availableQty} unit.`);
    } else {
      if (availableAmount <= 0) return new Error(`Saldo portofolio ${subType} Anda kosong.`);
      if (amount > availableAmount) return new Error(`Saldo tidak cukup! Maksimal penarikan: Rp ${availableAmount.toLocaleString('id-ID')}`);
    }
    return null; 
  };

  const addInv = async ({ invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty);
      if (err) return err; 
    }
    const { data, error } = await supabase.from('investasi').insert({ user_id: user.id, inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id }).select().single()
    if (error) return error
    setInvData(prev => [mapInv(data), ...prev])
    return null
  }

  const updateInv = async (id, { invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty, id);
      if (err) return err; 
    }
    const { data, error } = await supabase.from('investasi')
      .update({ inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id })
      .eq('id', id).eq('user_id', user.id).select().single()
    if (!error) setInvData(prev => prev.map(t => t.id === id ? mapInv(data) : t))
    return error
  }
  const deleteInv = async (id) => {
    const { error } = await supabase.from('investasi').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setInvData(prev => prev.filter(t => t.id !== id))
    return error
  }

  // FUNGSI TRANSFER YANG DIPERBAIKI (MENGGUNAKAN KATEGORI "Transfer")
  const transferWallet = async ({ fromId, toId, amount, descOut, descIn, date }) => {
    const errOut = await addTx({ desc: descOut, amount, type: 'out', cat: 'Transfer', date, wallet_id: fromId });
    if (errOut) return errOut;
    const errIn = await addTx({ desc: descIn, amount, type: 'in', cat: 'Transfer', date, wallet_id: toId });
    return errIn;
  }

  const addBill = async ({ nama_tagihan, amount, jatuh_tempo }) => {
    const { data, error } = await supabase.from('tagihan').insert({ user_id: user.id, nama_tagihan, amount, jatuh_tempo }).select().single()
    if (!error) setBillData(prev => [...prev, data].sort((a,b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo)))
    return error
  }
  const toggleBill = async (id, currentStatus) => {
    const isLunasNow = !currentStatus;
    const { error } = await supabase.from('tagihan').update({ is_lunas: isLunasNow }).eq('id', id).eq('user_id', user.id)
    if (!error) {
      setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: isLunasNow } : b))
      if (isLunasNow) {
        const bill = billData.find(b => b.id === id);
        if (bill) {
          const today = new Date().toISOString().split('T')[0];
          await addTx({ desc: `Bayar Tagihan: ${bill.nama_tagihan}`, amount: Number(bill.amount), type: 'out', cat: 'Tagihan', date: today, wallet_id: null });
          const dateObj = new Date(bill.jatuh_tempo);
          dateObj.setMonth(dateObj.getMonth() + 1);
          await addBill({ nama_tagihan: bill.nama_tagihan, amount: Number(bill.amount), jatuh_tempo: dateObj.toISOString().split('T')[0] });
        }
      }
    }
  }
  const deleteBill = async (id) => {
    const { error } = await supabase.from('tagihan').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setBillData(prev => prev.filter(b => b.id !== id))
  }

  const totals = useMemo(() => {
    // PERBAIKAN: Total Global MENGABAIKAN Kategori 'Transfer'
    const totalIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer').reduce((s, t) => s + t.amount, 0)
    const totalOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer').reduce((s, t) => s + t.amount, 0)
    const invBuy = invData.filter(t => t.action === 'beli').reduce((s, t) => s + t.amount, 0)
    const invSell = invData.filter(t => t.action === 'jual').reduce((s, t) => s + t.amount, 0)

    const totalSaldoAwalDompet = walletData.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const saldo = totalSaldoAwalDompet + (totalIn + invSell) - (totalOut + invBuy)
    
    const invNet = invBuy - invSell

    const walletBalances = walletData.map(w => {
      const wTxs = txData.filter(t => t.wallet_id === w.id);
      
      // PERBAIKAN: Dompet spesifik TETAP MENGHITUNG 'Transfer' agar saldonya berubah
      const wIn = wTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
      const wOut = wTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
      
      const wInvs = invData.filter(i => i.wallet_id === w.id);
      const invJual = wInvs.filter(i => i.action === 'jual').reduce((s, i) => s + i.amount, 0);
      const invBeli = wInvs.filter(i => i.action === 'beli').reduce((s, i) => s + i.amount, 0);
      
      return {
        ...w,
        calculatedBalance: (Number(w.balance) || 0) + (wIn + invJual) - (wOut + invBeli) 
      };
    });

    return { totalIn, totalOut, invBuy, invSell, invNet, saldo, walletBalances }
  }, [txData, invData, walletData])

  return (
    <DataContext.Provider value={{ 
      txData, invData, billData, walletData, loading, loadAll, 
      addWallet, updateWallet, deleteWallet,
      addTx, deleteTx, addInv, updateInv, deleteInv,
      transferWallet, addBill, toggleBill, deleteBill, totals 
    }}>
      {children}
    </DataContext.Provider>
  )
}
export const useData = () => useContext(DataContext)