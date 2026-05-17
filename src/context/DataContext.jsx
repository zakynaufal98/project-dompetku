import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { CATEGORY_TREE, isCashflowIncomeTx, isCashflowExpenseTx } from '../lib/utils'

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
  const [userCustomCats, setUserCustomCats] = useState([])
  const [userHiddenCats, setUserHiddenCats] = useState([])
  const [loading, setLoading] = useState(true)
  
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
    bill_id: r.bill_id || null,
    investment_id: r.investment_id || null,
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

    try {
      const uid = effectiveUserId

      const [txRes, invRes, billRes, walletRes, targetRes, budgetRes, recurringRes, customCatsRes, hiddenCatsRes] = await Promise.all([
        supabase.from('transaksi').select('*').eq('user_id', uid).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('investasi').select('*').eq('user_id', uid).order('tgl', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('tagihan').select('*').eq('user_id', uid).order('jatuh_tempo', { ascending: true }),
        supabase.from('wallets').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('target_finansial').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', uid),
        supabase.from('recurring_tx').select('*').eq('user_id', uid).order('next_date', { ascending: true }),
        supabase.from('user_categories').select('*').eq('user_id', user.id),
        supabase.from('user_hidden_categories').select('*').eq('user_id', user.id)
      ])

      if (!txRes.error)         setTxData((txRes.data  || []).map(mapTx))
      if (!invRes.error)        setInvData((invRes.data  || []).map(mapInv))
      if (!billRes.error)       setBillData(billRes.data || [])
      if (!walletRes.error)     setWalletData(walletRes.data || [])
      if (!targetRes.error)     setTargetData((targetRes.data || []).map(mapTarget))
      if (!budgetRes.error)     setBudgetData(budgetRes.data || [])
      if (!recurringRes.error)  setRecurringData(recurringRes.data || [])
      if (!customCatsRes.error) setUserCustomCats(customCatsRes.data || [])
      if (!hiddenCatsRes.error) setUserHiddenCats(hiddenCatsRes.data || [])

      const { data: sharedData } = await supabase.from('shared_accounts').select('*').eq('member_id', user.id).eq('status', 'accepted')
      setSharedOwners(sharedData || [])
    } finally {
      setLoading(false)
    }
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

  // --- EFFECTIVE CATEGORY TREE (default + custom - hidden) ---
  const effectiveCategoryTree = useMemo(() => {
    const buildTree = (type) => {
      const defaultTree = CATEGORY_TREE[type] || {}
      const hiddenSet = new Set(userHiddenCats.filter(h => h.type === type).map(h => h.main_cat))
      const result = {}
      Object.entries(defaultTree).forEach(([mainCat, subCats]) => {
        if (!hiddenSet.has(mainCat)) result[mainCat] = subCats
      })
      userCustomCats.filter(c => c.type === type).forEach(c => {
        result[c.main_cat] = c.sub_cats || []
      })
      return result
    }
    return { in: buildTree('in'), out: buildTree('out') }
  }, [userCustomCats, userHiddenCats])

  const addCustomCat = async (type, main_cat, sub_cats = []) => {
    const { data, error } = await supabase.from('user_categories')
      .insert({ user_id: user.id, type, main_cat, sub_cats })
      .select().single()
    if (!error) setUserCustomCats(prev => [...prev, data])
    return error
  }

  const deleteCustomCat = async (id) => {
    const { error } = await supabase.from('user_categories').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setUserCustomCats(prev => prev.filter(c => c.id !== id))
    return error
  }

  const updateCustomCat = async (id, sub_cats) => {
    const { error } = await supabase.from('user_categories').update({ sub_cats }).eq('id', id).eq('user_id', user.id)
    if (!error) setUserCustomCats(prev => prev.map(c => c.id === id ? { ...c, sub_cats } : c))
    return error
  }

  const toggleHideDefaultCat = async (type, main_cat) => {
    const existing = userHiddenCats.find(h => h.type === type && h.main_cat === main_cat)
    if (existing) {
      const { error } = await supabase.from('user_hidden_categories').delete().eq('id', existing.id)
      if (!error) setUserHiddenCats(prev => prev.filter(h => h.id !== existing.id))
      return error
    } else {
      const { data, error } = await supabase.from('user_hidden_categories')
        .insert({ user_id: user.id, type, main_cat })
        .select().single()
      if (!error) setUserHiddenCats(prev => [...prev, data])
      return error
    }
  }

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

  const isMissingColumn = (error, field) => (
    error?.code === 'PGRST204' &&
    String(error?.message || '').toLowerCase().includes(field)
  )

  const withoutField = (obj, field) => {
    const { [field]: _removed, ...rest } = obj
    return rest
  }

  const getWalletCalculatedBalance = (walletId) => {
    const wallet = walletData.find(w => w.id === walletId)
    if (!wallet) return 0
    const walletTx = txData.filter(t => t.wallet_id === walletId)
    const walletIn = walletTx.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0)
    const walletOut = walletTx.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0)
    return (Number(wallet.balance) || 0) + walletIn - walletOut
  }

  const getProjectedWalletBalance = ({ wallet_id = null, type, amount, originalTx = null }) => {
    if (!wallet_id) return Infinity
    let projected = getWalletCalculatedBalance(wallet_id)

    if (originalTx?.wallet_id === wallet_id) {
      if (originalTx.type === 'out') projected += Number(originalTx.amount) || 0
      if (originalTx.type === 'in') projected -= Number(originalTx.amount) || 0
    }

    if (type === 'out') projected -= Number(amount) || 0
    if (type === 'in') projected += Number(amount) || 0
    return projected
  }

  const validateWalletBalance = ({ wallet_id = null, type, amount, originalTx = null }) => {
    if (!wallet_id || type !== 'out') return null
    const projected = getProjectedWalletBalance({ wallet_id, type, amount, originalTx })
    if (projected >= 0) return null
    const walletName = walletData.find(w => w.id === wallet_id)?.name || 'dompet'
    return new Error(`Saldo ${walletName} tidak mencukupi untuk transaksi ini.`)
  }

  const insertTxRecord = async ({ desc, amount, type, cat, sub_cat, date, wallet_id = null, bill_id = null, investment_id = null }, options = {}) => {
    if (!canWriteActiveAccount) return { data: null, error: readonlyError }
    if (!options.skipBalanceCheck) {
      const balanceError = validateWalletBalance({ wallet_id, type, amount })
      if (balanceError) return { data: null, error: balanceError }
    }

    let payload = { user_id: effectiveUserId, keterangan: desc, amount, tipe: type, cat, sub_cat, tgl: date, wallet_id, created_by_email: user.email }
    if (bill_id) payload.bill_id = bill_id
    if (investment_id) payload.investment_id = investment_id

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data, error } = await supabase.from('transaksi').insert(payload).select().single()
      if (!error) {
        const mapped = mapTx(data)
        setTxData(prev => [mapped, ...prev])
        return { data: mapped, error: null }
      }
      if (payload.bill_id && isMissingColumn(error, 'bill_id')) {
        payload = withoutField(payload, 'bill_id')
        continue
      }
      if (payload.investment_id && isMissingColumn(error, 'investment_id')) {
        payload = withoutField(payload, 'investment_id')
        continue
      }
      return { data: null, error }
    }

    return { data: null, error: new Error('Gagal menyimpan transaksi.') }
  }

  const restoreBillAfterDeletedPayment = async (tx) => {
    const paidBillId = tx?.type === 'out' ? tx.bill_id : null
    const paidBillName = tx?.type === 'out' && tx?.desc?.startsWith('Bayar Tagihan:')
      ? tx.desc.replace('Bayar Tagihan:', '').trim()
      : ''

    if (!paidBillId && !paidBillName) return

    const paidBill = paidBillId
      ? billData.find(b => b.id === paidBillId && b.is_lunas)
      : billData
        .filter(b =>
          b.is_lunas &&
          b.nama_tagihan?.toLowerCase() === paidBillName.toLowerCase() &&
          Number(b.amount) === Number(tx.amount)
        )
        .sort((a, b) => Math.abs(new Date(a.jatuh_tempo) - new Date(tx.date)) - Math.abs(new Date(b.jatuh_tempo) - new Date(tx.date)))[0]

    if (!paidBill) return

    const { error: restoreError } = await supabase
      .from('tagihan')
      .update({ is_lunas: false })
      .eq('id', paidBill.id)
      .eq('user_id', effectiveUserId)

    if (!restoreError) {
      setBillData(prev => prev.map(b => b.id === paidBill.id ? { ...b, is_lunas: false } : b))
    }

    const generatedNextBill = billData.find(b => b.source_bill_id === paidBill.id && !b.is_lunas)
    if (!generatedNextBill) return

    const { error: deleteGeneratedError } = await supabase
      .from('tagihan')
      .delete()
      .eq('id', generatedNextBill.id)
      .eq('user_id', effectiveUserId)

    if (!deleteGeneratedError) {
      setBillData(prev => prev.filter(b => b.id !== generatedNextBill.id))
    }
  }

  const deleteTxRecord = async (id, options = {}) => {
    if (!canWriteActiveAccount) return { data: null, error: readonlyError }
    const tx = txData.find(t => t.id === id)
    const { error } = await supabase.from('transaksi').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (error) return { data: null, error }

    setTxData(prev => prev.filter(t => t.id !== id))
    if (options.restoreRelatedBill) await restoreBillAfterDeletedPayment(tx)
    return { data: tx, error: null }
  }

  const addTx = async (payload) => {
    const { error } = await insertTxRecord(payload)
    return error
  }
  
  const updateTx = async (id, { desc, amount, type, cat, sub_cat, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    const originalTx = txData.find(t => t.id === id)
    const balanceError = validateWalletBalance({ wallet_id, type, amount, originalTx })
    if (balanceError) return balanceError
    const { data, error } = await supabase.from('transaksi')
      .update({ keterangan: desc, amount, tipe: type, cat, sub_cat, tgl: date, wallet_id })
      .eq('id', id).eq('user_id', effectiveUserId).select().single()
    if (!error) setTxData(prev => prev.map(t => t.id === id ? mapTx(data) : t))
    return error
  }

  const deleteTx = async (id) => {
    const { error } = await deleteTxRecord(id, { restoreRelatedBill: true })
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

  const insertBillRecord = async ({ nama_tagihan, amount, jatuh_tempo, source_bill_id = null }) => {
    if (!canWriteActiveAccount) return { data: null, error: readonlyError }
    let payload = { user_id: effectiveUserId, nama_tagihan, amount, jatuh_tempo }
    if (source_bill_id) payload.source_bill_id = source_bill_id

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data, error } = await supabase.from('tagihan').insert(payload).select().single()
      if (!error) {
        setBillData(prev => [...prev, data].sort((a, b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo)))
        return { data, error: null }
      }
      if (payload.source_bill_id && isMissingColumn(error, 'source_bill_id')) {
        payload = withoutField(payload, 'source_bill_id')
        continue
      }
      return { data: null, error }
    }

    return { data: null, error: new Error('Gagal menyimpan tagihan.') }
  }

  const deleteBillRecord = async (id) => {
    const { error } = await supabase.from('tagihan').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (!error) setBillData(prev => prev.filter(b => b.id !== id))
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

  const buildInvestmentJournalEntries = ({ investmentId, subType, amount, action, qty, date, wallet_id = null, excludeId = null }) => {
    if (action === 'beli') {
      return [{
        desc: `Beli Aset: ${subType}`,
        amount,
        type: 'out',
        cat: 'Transfer',
        sub_cat: 'Beli Investasi',
        date,
        wallet_id,
        investment_id: investmentId,
      }]
    }

    let totalQty = 0
    let totalModal = 0
    const history = [...invData].filter(t => t.subType === subType && t.id !== excludeId).sort((a, b) => a.ts - b.ts)

    history.forEach(t => {
      if (t.action === 'beli') {
        totalQty += (t.qty || 0)
        totalModal += t.amount
      } else {
        const avgCost = totalQty > 0 ? (totalModal / totalQty) : 0
        totalQty -= (t.qty || 0)
        totalModal -= ((t.qty || 0) * avgCost)
      }
    })

    const currentAvgCost = totalQty > 0 ? (totalModal / totalQty) : 0
    const modalKembali = qty * currentAvgCost
    const realizedPnL = amount - modalKembali
    const entries = [{
      desc: `Tarik Modal: ${subType}`,
      amount: modalKembali,
      type: 'in',
      cat: 'Transfer',
      sub_cat: 'Tarik Investasi',
      date,
      wallet_id,
      investment_id: investmentId,
    }]

    if (realizedPnL > 0) {
      entries.push({
        desc: `Profit: ${subType}`,
        amount: realizedPnL,
        type: 'in',
        cat: 'Pemasukan Utama',
        sub_cat: 'Profit Investasi',
        date,
        wallet_id,
        investment_id: investmentId,
      })
    } else if (realizedPnL < 0) {
      entries.push({
        desc: `Loss: ${subType}`,
        amount: Math.abs(realizedPnL),
        type: 'out',
        cat: 'Lainnya',
        sub_cat: 'Rugi Investasi',
        date,
        wallet_id,
        investment_id: investmentId,
      })
    }

    return entries
  }

  const amountsAlmostEqual = (left, right, tolerance = 0.01) => Math.abs(Number(left || 0) - Number(right || 0)) <= tolerance

  const matchesInvestmentJournalEntry = (tx, entry) =>
    tx?.desc === entry?.desc &&
    tx?.type === entry?.type &&
    tx?.cat === entry?.cat &&
    tx?.sub_cat === entry?.sub_cat &&
    tx?.date === entry?.date &&
    tx?.wallet_id === entry?.wallet_id &&
    amountsAlmostEqual(tx?.amount, entry?.amount)

  const findInvestmentJournalTxs = (investmentTx) => {
    const expectedEntries = buildInvestmentJournalEntries({
      investmentId: investmentTx.id,
      subType: investmentTx.subType,
      amount: investmentTx.amount,
      action: investmentTx.action,
      qty: investmentTx.qty || 0,
      date: investmentTx.date,
      wallet_id: investmentTx.wallet_id,
      excludeId: investmentTx.id,
    })

    const direct = txData.filter(t => t.investment_id === investmentTx.id)
    const fallback = txData.filter(tx => expectedEntries.some(entry => matchesInvestmentJournalEntry(tx, entry)))
    const combined = [...direct, ...fallback]
    const unique = combined.filter((tx, index, arr) => arr.findIndex(item => item.id === tx.id) === index)

    if (unique.length > 0) return unique

    return txData.filter(tx =>
      tx.date === investmentTx.date &&
      tx.wallet_id === investmentTx.wallet_id &&
      ((tx.sub_cat === 'Tarik Investasi' && tx.desc?.includes(investmentTx.subType)) ||
        (tx.sub_cat === 'Profit Investasi' && tx.desc?.includes(investmentTx.subType)) ||
        (tx.sub_cat === 'Rugi Investasi' && tx.desc?.includes(investmentTx.subType)) ||
        (tx.sub_cat === 'Beli Investasi' && tx.desc?.includes(investmentTx.subType)))
    )
  }

  const recreateTxSnapshots = async (snapshots) => {
    for (const tx of snapshots) {
      const { error } = await insertTxRecord({
        desc: tx.desc,
        amount: tx.amount,
        type: tx.type,
        cat: tx.cat,
        sub_cat: tx.sub_cat,
        date: tx.date,
        wallet_id: tx.wallet_id,
        bill_id: tx.bill_id,
        investment_id: tx.investment_id,
      }, { skipBalanceCheck: true })
      if (error) return error
    }
    return null
  }

  // 👇 PERBAIKAN BESAR: LOGIKA DOUBLE-ENTRY UNTUK INVESTASI 👇
  const addInv = async ({ invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty)
      if (err) return err
    }

    const { data, error } = await supabase.from('investasi').insert({ user_id: effectiveUserId, inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id }).select().single()
    if (error) return error

    const entries = buildInvestmentJournalEntries({
      investmentId: data.id,
      subType,
      amount,
      action,
      qty: qty || 0,
      date,
      wallet_id,
    })

    const createdTxIds = []
    for (const entry of entries) {
      const { data: tx, error: txError } = await insertTxRecord(entry)
      if (txError) {
        for (const txId of createdTxIds.reverse()) {
          await deleteTxRecord(txId)
        }
        await supabase.from('investasi').delete().eq('id', data.id).eq('user_id', effectiveUserId)
        return txError
      }
      createdTxIds.push(tx.id)
    }

    setInvData(prev => [mapInv(data), ...prev])
    return null
  }

  const updateInv = async (id, { invType, subType, desc, amount, action, unit, qty, date, wallet_id = null }) => {
    if (!canWriteActiveAccount) return readonlyError
    if (action === 'jual') {
      const err = validateSellInvestment(invType, subType, amount, qty, id)
      if (err) return err
    }

    const originalInv = invData.find(t => t.id === id)
    if (!originalInv) return new Error('Data investasi tidak ditemukan.')

    const oldJournalTxs = findInvestmentJournalTxs(originalInv)
    const oldSnapshots = oldJournalTxs.map(tx => ({ ...tx }))
    const deletedSnapshots = []

    for (const tx of oldJournalTxs) {
      const { error: deleteError } = await deleteTxRecord(tx.id)
      if (deleteError) {
        if (deletedSnapshots.length > 0) {
          const restoreError = await recreateTxSnapshots(deletedSnapshots)
          if (restoreError) return restoreError
        }
        return deleteError
      }
      deletedSnapshots.push(tx)
    }

    const nextEntries = buildInvestmentJournalEntries({
      investmentId: id,
      subType,
      amount,
      action,
      qty: qty || 0,
      date,
      wallet_id,
      excludeId: id,
    })

    const createdTxIds = []
    for (const entry of nextEntries) {
      const { data: tx, error: txError } = await insertTxRecord(entry)
      if (txError) {
        for (const txId of createdTxIds.reverse()) {
          await deleteTxRecord(txId)
        }
        if (oldSnapshots.length > 0) {
          const restoreError = await recreateTxSnapshots(oldSnapshots)
          if (restoreError) return restoreError
        }
        return txError
      }
      createdTxIds.push(tx.id)
    }

    const { data, error } = await supabase.from('investasi')
      .update({ inv_type: invType, sub_type: subType, keterangan: desc, amount, action, unit, qty, tgl: date, wallet_id })
      .eq('id', id).eq('user_id', effectiveUserId).select().single()

    if (error) {
      for (const txId of createdTxIds.reverse()) {
        await deleteTxRecord(txId)
      }
      if (oldSnapshots.length > 0) {
        const restoreError = await recreateTxSnapshots(oldSnapshots)
        if (restoreError) return restoreError
      }
      return error
    }

    setInvData(prev => prev.map(t => t.id === id ? mapInv(data) : t))
    return null
  }

  const deleteInv = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const originalInv = invData.find(t => t.id === id)
    if (!originalInv) return new Error('Data investasi tidak ditemukan.')

    const journalTxs = findInvestmentJournalTxs(originalInv)
    const snapshots = journalTxs.map(tx => ({ ...tx }))
    const deletedSnapshots = []

    for (const tx of journalTxs) {
      const { error: deleteError } = await deleteTxRecord(tx.id)
      if (deleteError) {
        if (deletedSnapshots.length > 0) {
          const restoreError = await recreateTxSnapshots(deletedSnapshots)
          if (restoreError) return restoreError
        }
        return deleteError
      }
      deletedSnapshots.push(tx)
    }

    const { error } = await supabase.from('investasi').delete().eq('id', id).eq('user_id', effectiveUserId)
    if (error) {
      if (snapshots.length > 0) {
        const restoreError = await recreateTxSnapshots(snapshots)
        if (restoreError) return restoreError
      }
      return error
    }

    setInvData(prev => prev.filter(t => t.id !== id))
    return error
  }

  const transferWallet = async ({ fromId, toId, amount, fee, descOut, descIn, date }) => {
    const createdTxIds = []
    const { data: outTx, error: errOut } = await insertTxRecord({ desc: descOut, amount, type: 'out', cat: 'Transfer', sub_cat: 'Transfer Keluar', date, wallet_id: fromId })
    if (errOut) return errOut
    createdTxIds.push(outTx.id)

    const { data: inTx, error: errIn } = await insertTxRecord({ desc: descIn, amount, type: 'in', cat: 'Transfer', sub_cat: 'Transfer Masuk', date, wallet_id: toId })
    if (errIn) {
      await deleteTxRecord(outTx.id)
      return errIn
    }
    createdTxIds.push(inTx.id)

    if (fee && fee > 0) {
      const { error: errFee } = await insertTxRecord({ desc: 'Biaya Admin Transfer', amount: fee, type: 'out', cat: 'Lainnya', sub_cat: 'Biaya Admin', date, wallet_id: fromId })
      if (errFee) {
        for (const txId of createdTxIds.reverse()) {
          await deleteTxRecord(txId)
        }
        return errFee
      }
    }
    return null
  }

  const addBill = async ({ nama_tagihan, amount, jatuh_tempo, source_bill_id = null }) => {
    const { error } = await insertBillRecord({ nama_tagihan, amount, jatuh_tempo, source_bill_id })
    return error
  }
  
  const toggleBill = async (id, currentStatus, walletId = null) => {
    if (!canWriteActiveAccount) return readonlyError
    const isLunasNow = !currentStatus
    const bill = billData.find(b => b.id === id)
    if (!bill) return new Error('Tagihan tidak ditemukan.')

    if (!isLunasNow) {
      const { error } = await supabase.from('tagihan').update({ is_lunas: false }).eq('id', id).eq('user_id', effectiveUserId)
      if (!error) setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: false } : b))
      return error
    }

    const today = new Date().toISOString().split('T')[0]
    const { data: paymentTx, error: paymentError } = await insertTxRecord({
      desc: `Bayar Tagihan: ${bill.nama_tagihan}`,
      amount: Number(bill.amount),
      type: 'out',
      cat: 'Tagihan & Utilitas',
      sub_cat: 'Lain-lain',
      date: today,
      wallet_id: walletId,
      bill_id: bill.id,
    })
    if (paymentError) return paymentError

    const dateObj = new Date(bill.jatuh_tempo)
    dateObj.setMonth(dateObj.getMonth() + 1)
    const { data: nextBill, error: nextBillError } = await insertBillRecord({
      nama_tagihan: bill.nama_tagihan,
      amount: Number(bill.amount),
      jatuh_tempo: dateObj.toISOString().split('T')[0],
      source_bill_id: bill.id
    })
    if (nextBillError) {
      await deleteTxRecord(paymentTx.id)
      return nextBillError
    }

    const { error } = await supabase.from('tagihan').update({ is_lunas: true }).eq('id', id).eq('user_id', effectiveUserId)
    if (error) {
      if (nextBill?.id) await deleteBillRecord(nextBill.id)
      await deleteTxRecord(paymentTx.id)
      return error
    }

    setBillData(prev => prev.map(b => b.id === id ? { ...b, is_lunas: true } : b))
    return null
  }
  
  const deleteBill = async (id) => {
    if (!canWriteActiveAccount) return readonlyError
    const error = await deleteBillRecord(id)
    return error
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
    const totalIn  = txData.filter(t => isCashflowIncomeTx(t)).reduce((s, t) => s + t.amount, 0)
    const totalOut = txData.filter(t => isCashflowExpenseTx(t)).reduce((s, t) => s + t.amount, 0)
    
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
      addTx, updateTx, deleteTx, addInv, updateInv, deleteInv,
      transferWallet, addBill, toggleBill, deleteBill,
      addTarget, updateTarget, deleteTarget,
      budgetData, saveBudget, deleteBudget,
      recurringData, addRecurring, updateRecurring, deleteRecurring,
      userCustomCats, userHiddenCats, effectiveCategoryTree,
      addCustomCat, deleteCustomCat, updateCustomCat, toggleHideDefaultCat,
      totals, getProjectedWalletBalance,
      // Shared Account
      sharedOwners, activeOwnerId, switchAccount, isViewingShared, activeSharedRole
    }}>
      {children}
    </DataContext.Provider>
  )
}
export const useData = () => useContext(DataContext)
