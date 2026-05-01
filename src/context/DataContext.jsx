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
  const [targetData, setTargetData] = useState([])
  const [budgetData, setBudgetData] = useState([])
  const [recurringData, setRecurringData] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Shared Account: siapa yang sedang dilihat datanya
  const [activeOwnerId, setActiveOwnerId] = useState(null) // null = data sendiri
  const [sharedOwners, setSharedOwners] = useState([]) // akun yang share ke saya
  const effectiveUserId = activeOwnerId || user?.id
  const activeSharedRole = activeOwnerId ? sharedOwners.find(s => s.owner_id === activeOwnerId)?.role || null : null
  const canWriteActiveAccount = !activeOwnerId || activeSharedRole === 'editor'
  const readonlyError = { message: 'Akses hanya lihat. Minta role Editor untuk mengubah data akun ini.' }

  const mapTx = (r) => ({
    id: r.id, desc: r.keterangan, amount: parseFloat(r.amount),
    type: r.tipe, cat: r.cat, sub_cat: r.sub_cat, date: r.tgl, 
    wallet_id: r.wallet_id, 
    created_by_email: r.created_by_email || null,
    user_id: r.user_id,
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

  const mapTarget = (r) => ({
    id: r.id, name: r.name, amount: parseFloat(r.target_amount || 0), saved: parseFloat(r.saved_amount || 0),
    monthlyBoost: parseFloat(r.monthly_boost || 0), created_at: r.created_at, updated_at: r.updated_at,
  })

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    
    const uid = effectiveUserId
    
    const [txRes, invRes, billRes, walletRes, targetRes, budgetRes, recurringRes] = await Promise.all([
      supabase.from('transaksi').select('*').eq('user_id', uid).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('investasi').select('*').eq('user_id', uid).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('tagihan').select('*').eq('user_id', uid).order('jatuh_tempo', { ascending: true }),
      supabase.from('wallets').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
      supabase.from('target_finansial').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', uid),
      supabase.from('recurring_tx').select('*').eq('user_id', uid).order('next_date', { ascending: true })
    ])
    
    if (!txRes.error)  setTxData((txRes.data  || []).map(mapTx))
    if (!invRes.error) setInvData((invRes.data  || []).map(mapInv))
    if (!billRes.error) setBillData(billRes.data || [])
    if (!walletRes.error) setWalletData(walletRes.data || []) 
    if (!targetRes.error) setTargetData((targetRes.data || []).map(mapTarget))
    if (!budgetRes.error) setBudgetData(budgetRes.data || [])
    if (!recurringRes.error) setRecurringData(recurringRes.data || [])
    
    // Load shared owners (akun yang share ke saya)
    const { data: sharedData } = await supabase.from('shared_accounts').select('*').eq('member_id', user.id).eq('status', 'accepted')
    setSharedOwners(sharedData || [])
    
    setLoading(false)
  }, [user, effectiveUserId])

  useEffect(() => { loadAll() }, [loadAll])

  // --- AUTO PROCESS RECURRING TX ---
  useEffect(() => {
    const processRecurring = async () => {
      if (recurringData.length === 0 || activeOwnerId) return; // Jangan proses jika sedang melihat akun orang lain
      const today = new Date();
      today.setHours(0,0,0,0);
      
      for (const r of recurringData) {
        if (!r.is_active) continue;
        const nextDate = new Date(r.next_date);
        nextDate.setHours(0,0,0,0);
        
        if (nextDate <= today) {
          // 1. Eksekusi transaksi
          await addTx({
            desc: r.desc_text,
            amount: r.amount,
            type: r.tx_type,
            cat: r.cat,
            sub_cat: r.sub_cat || 'Lain-lain',
            date: r.next_date,
            wallet_id: r.wallet_id
          });
          
          // 2. Hitung tanggal berikutnya
          const newDate = new Date(r.next_date);
          if (r.frequency === 'daily') newDate.setDate(newDate.getDate() + 1);
          else if (r.frequency === 'weekly') newDate.setDate(newDate.getDate() + 7);
          else if (r.frequency === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
          else if (r.frequency === 'yearly') newDate.setFullYear(newDate.getFullYear() + 1);
          
          // 3. Update data recurring di Supabase
          const dateStr = newDate.toISOString().split('T')[0];
          await updateRecurring(r.id, { next_date: dateStr });
        }
      }
    };
    processRecurring();
  }, [recurringData, activeOwnerId]);

  const addWallet = async ({ name, balance, color }) => {
    if (!canWriteActiveAccount) return readonlyError
    const { data, error } = await supabase.from('wallets').insert({ user_id: effectiveUserId, name, balance, color }).select().single()
    if (!error) setWalletData(prev => [...prev, data])
    return error
  }
  const updateWallet = async (id, { name, balance, color }) => {
    if (!canWriteActiveAccount) return readonlyError
    const { data, error } = await supabase.from('wallets').update({ name, balance, color }).eq('id', id).eq('user_id', effectiveUserId).select().single()
    if (!error) setWalletData(prev => prev.map(w => w.id === id ? data : w))
    return error
  }
  const deleteWallet = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setWalletData(prev => prev.filter(w => w.id !== id))
    return error
  }

  const addTx = async ({ desc, amount, type, cat, sub_cat, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    const { data, error } = await supabase.from('transaksi')
      .insert({ user_id: effectiveUserId, keterangan: desc, amount, tipe: type, cat, sub_cat, tgl: date, wallet_id, created_by_email: user.email })
      .select().single()
    if (error) return error
    setTxData(prev => [mapTx(data), ...prev])
    return null
  }
  
  const deleteTx = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const { error } = await supabase.from('transaksi').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setTxData(prev => prev.filter(t => t.id !== id))
    return error
  }

  // --- BUDGETS ---
  const saveBudget = async (category, amount) => {
    if (!canWriteActiveAccount) return readonlyError;
    const existing = budgetData.find(b => b.category === category);
    let result, err;
    if (existing) {
      const { data, error } = await supabase.from('budgets').update({ amount }).eq('id', existing.id).eq('user_id', effectiveUserId).select().single();
      result = data; err = error;
    } else {
      const { data, error } = await supabase.from('budgets').insert({ user_id: effectiveUserId, category, amount }).select().single();
      result = data; err = error;
    }
    if (!err) {
      setBudgetData(prev => existing ? prev.map(b => b.id === result.id ? result : b) : [...prev, result]);
    }
    return err;
  }
  
  const deleteBudget = async (id) => {
    if (!canWriteActiveAccount) return readonlyError;
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', effectiveUserId);
    if (!error) setBudgetData(prev => prev.filter(b => b.id !== id));
    return error;
  }

  // --- RECURRING TX ---
  const addRecurring = async (dataObj) => {
    if (!canWriteActiveAccount) return readonlyError;
    const { data, error } = await supabase.from('recurring_tx')
      .insert({ ...dataObj, user_id: effectiveUserId })
      .select().single();
    if (!error) setRecurringData(prev => [...prev, data]);
    return error;
  }

  const updateRecurring = async (id, updates) => {
    if (!canWriteActiveAccount) return readonlyError;
    const { data, error } = await supabase.from('recurring_tx').update(updates).eq('id', id).eq('user_id', effectiveUserId).select().single();
    if (!error) setRecurringData(prev => prev.map(r => r.id === id ? data : r));
    return error;
  }

  const deleteRecurring = async (id) => {
    if (!canWriteActiveAccount) return readonlyError;
    const { error } = await supabase.from('recurring_tx').delete().eq('id', id).eq('user_id', effectiveUserId);
    if (!error) setRecurringData(prev => prev.filter(r => r.id !== id));
    return error;
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

  // 👇 PERBAIKAN BESAR: LOGIKA DOUBLE-ENTRY UNTUK INVESTASI 👇
  const addInv = async ({ invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    let realizedPnL = 0;
    let modalKembali = 0;

    // 1. Jika Jual, Hitung Average Cost & Profit/Loss
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty);
      if (err) return err; 

      let totalQty = 0; let totalModal = 0;
      // Urutkan riwayat dari yang paling lama untuk menghitung Average Cost berjalan
      const history = [...invData].filter(t => t.subType === subType).sort((a,b) => a.ts - b.ts);
      
      history.forEach(t => {
        if (t.action === 'beli') {
          totalQty += (t.qty || 0);
          totalModal += t.amount;
        } else if (t.action === 'jual') {
          const avgCost = totalQty > 0 ? (totalModal / totalQty) : 0;
          totalQty -= (t.qty || 0);
          totalModal -= ((t.qty || 0) * avgCost);
        }
      });

      const currentAvgCost = totalQty > 0 ? (totalModal / totalQty) : 0;
      modalKembali = qty * currentAvgCost;
      realizedPnL = amount - modalKembali;
    }

    // 2. Simpan Catatan di Tabel Investasi
    const { data, error } = await supabase.from('investasi').insert({ user_id: effectiveUserId, inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id }).select().single()
    if (error) return error

    // 3. ✨ THE MAGIC: Otomatisasi Jurnal Transaksi (Cashflow) ✨
    if (action === 'beli') {
      // Catat sebagai Transfer Keluar (Kas berkurang, Aset bertambah)
      await addTx({ desc: `Beli Aset: ${subType}`, amount, type: 'out', cat: 'Transfer', sub_cat: 'Beli Investasi', date, wallet_id });
    } else if (action === 'jual') {
      // Catat Pengembalian Modal sebagai Transfer Masuk
      await addTx({ desc: `Tarik Modal: ${subType}`, amount: modalKembali, type: 'in', cat: 'Transfer', sub_cat: 'Tarik Investasi', date, wallet_id });
      
      // Catat Profit atau Loss secara murni
      if (realizedPnL > 0) {
        await addTx({ desc: `Profit: ${subType}`, amount: realizedPnL, type: 'in', cat: 'Pemasukan Utama', sub_cat: 'Profit Investasi', date, wallet_id });
      } else if (realizedPnL < 0) {
        await addTx({ desc: `Loss: ${subType}`, amount: Math.abs(realizedPnL), type: 'out', cat: 'Lainnya', sub_cat: 'Rugi Investasi', date, wallet_id });
      }
    }

    setInvData(prev => [mapInv(data), ...prev])
    return null
  }

  const updateInv = async (id, { invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    // (Untuk MVP, update investasi kita biarkan manual, tapi akan kita perbaiki nanti jika perlu)
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty, id);
      if (err) return err; 
    }
    const { data, error } = await supabase.from('investasi')
      .update({ inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id })
      .eq('id', id).eq('user_id', effectiveUserId).select().single()
    if (!error) setInvData(prev => prev.map(t => t.id === id ? mapInv(data) : t))
    return error
  }
  const deleteInv = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const { error } = await supabase.from('investasi').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setInvData(prev => prev.filter(t => t.id !== id))
    return error
  }

  const transferWallet = async ({ fromId, toId, amount, fee, descOut, descIn, date }) => {
    const errOut = await addTx({ desc: descOut, amount, type: 'out', cat: 'Transfer', date, wallet_id: fromId });
    if (errOut) return errOut;
    const errIn = await addTx({ desc: descIn, amount, type: 'in', cat: 'Transfer', date, wallet_id: toId });
    if (errIn) return errIn;
    if (fee && fee > 0) {
      const errFee = await addTx({ desc: 'Biaya Admin Transfer', amount: fee, type: 'out', cat: 'Lainnya', sub_cat: 'Biaya Admin', date, wallet_id: fromId });
      return errFee;
    }
    return null;
  }

  const addBill = async ({ nama_tagihan, amount, jatuh_tempo }) => {
    if (!canWriteActiveAccount) return readonlyError
    const { data, error } = await supabase.from('tagihan').insert({ user_id: effectiveUserId, nama_tagihan, amount, jatuh_tempo }).select().single()
    if (!error) setBillData(prev => [...prev, data].sort((a,b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo)))
    return error
  }
  
  const toggleBill = async (id, currentStatus, walletId = null) => {
    if (!canWriteActiveAccount) return readonlyError
    const isLunasNow = !currentStatus;
    const { error } = await supabase.from('tagihan').update({ is_lunas: isLunasNow }).eq('id', id).eq('user_id', effectiveUserId)
    
    if (!error) {
      setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: isLunasNow } : b))
      
      if (isLunasNow) {
        const bill = billData.find(b => b.id === id);
        if (bill) {
          const today = new Date().toISOString().split('T')[0];
          
          // 👇 MAGIC: Mencatat pengeluaran menggunakan Dompet dan Kategori yang Benar 👇
          await addTx({ 
            desc: `Bayar Tagihan: ${bill.nama_tagihan}`, 
            amount: Number(bill.amount), 
            type: 'out', 
            cat: 'Tagihan & Utilitas', // Sesuaikan dengan kategori di utils.js
            sub_cat: 'Lain-lain',
            date: today, 
            wallet_id: walletId // Uang akan langsung terpotong dari dompet pilihan
          });
          
          // Membuat duplikat untuk bulan depan
          const dateObj = new Date(bill.jatuh_tempo);
          dateObj.setMonth(dateObj.getMonth() + 1);
          await addBill({ 
            nama_tagihan: bill.nama_tagihan, 
            amount: Number(bill.amount), 
            jatuh_tempo: dateObj.toISOString().split('T')[0] 
          });
        }
      }
    }
  }
  
  const deleteBill = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const { error } = await supabase.from('tagihan').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setBillData(prev => prev.filter(b => b.id !== id))
  }

  const addTarget = async ({ name, amount, saved, monthlyBoost }) => {
    if (!canWriteActiveAccount) return { data: null, error: readonlyError }
    const { data, error } = await supabase.from('target_finansial').insert({ user_id: effectiveUserId, name, target_amount: amount, saved_amount: saved, monthly_boost: monthlyBoost }).select().single()
    if (!error) { const mapped = mapTarget(data); setTargetData(prev => [mapped, ...prev]); return { data: mapped, error: null } }
    return { data: null, error }
  }

  const updateTarget = async (id, { name, amount, saved, monthlyBoost }) => {
    if (!canWriteActiveAccount) return { data: null, error: readonlyError }
    const { data, error } = await supabase.from('target_finansial').update({ name, target_amount: amount, saved_amount: saved, monthly_boost: monthlyBoost, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', effectiveUserId).select().single()
    if (!error) { const mapped = mapTarget(data); setTargetData(prev => prev.map(t => t.id === id ? mapped : t)); return { data: mapped, error: null } }
    return { data: null, error }
  }

  const deleteTarget = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const { error } = await supabase.from('target_finansial').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setTargetData(prev => prev.filter(t => t.id !== id))
    return error
  }

  // 👇 LOGIKA TOTALS MENJADI SUPER BERSIH KARENA SEMUA ARUS KAS DITANGANI TABEL TRANSAKSI 👇
  const totals = useMemo(() => {
    const totalIn = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer').reduce((s, t) => s + t.amount, 0)
    const totalOut = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer').reduce((s, t) => s + t.amount, 0)
    
    const invBuy = invData.filter(t => t.action === 'beli').reduce((s, t) => s + t.amount, 0)
    const invSell = invData.filter(t => t.action === 'jual').reduce((s, t) => s + t.amount, 0)
    const invNet = invBuy - invSell

    // Saldo fisik 100% dipantau oleh mutasi di tabel transaksi
    const totalSaldoAwalDompet = walletData.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const globalTxIn = txData.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
    const globalTxOut = txData.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
    const saldo = totalSaldoAwalDompet + globalTxIn - globalTxOut;

    const walletBalances = walletData.map(w => {
      const wTxs = txData.filter(t => t.wallet_id === w.id);
      const wIn = wTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
      const wOut = wTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
      return { ...w, calculatedBalance: (Number(w.balance) || 0) + wIn - wOut };
    });

    return { totalIn, totalOut, invBuy, invSell, invNet, saldo, walletBalances }
  }, [txData, invData, walletData])

  // Switch ke akun shared
  const switchAccount = (ownerId) => {
    setActiveOwnerId(ownerId)
  }

  // Re-load saat switch account
  useEffect(() => { loadAll() }, [activeOwnerId])

  const isViewingShared = !!activeOwnerId

  return (
    <DataContext.Provider value={{ 
      txData, invData, billData, walletData, targetData, loading, loadAll, 
      addWallet, updateWallet, deleteWallet,
      addTx, deleteTx, addInv, updateInv, deleteInv,
      transferWallet, addBill, toggleBill, deleteBill,
      addTarget, updateTarget, deleteTarget,
      budgetData, saveBudget, deleteBudget,
      recurringData, addRecurring, updateRecurring, deleteRecurring,
      totals,
      // Shared Account
      sharedOwners, activeOwnerId, switchAccount, isViewingShared, activeSharedRole
    }}>
      {children}
    </DataContext.Provider>
  )
}
export const useData = () => useContext(DataContext)
