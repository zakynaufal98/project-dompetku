import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user }              = useAuth()
  const [txData,  setTxData]  = useState([])
  const [invData, setInvData] = useState([])
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
    const [txRes, invRes] = await Promise.all([
      supabase.from('transaksi').select('*').eq('user_id', user.id)
        .order('tgl', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('investasi').select('*').eq('user_id', user.id)
        .order('tgl', { ascending: false }).order('created_at', { ascending: false }),
    ])
    if (!txRes.error)  setTxData((txRes.data  || []).map(mapTx))
    if (!invRes.error) setInvData((invRes.data  || []).map(mapInv))
    setLoading(false)
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

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

  // PERBAIKAN: Menggunakan useMemo dan Logika Saldo yang Benar
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
    <DataContext.Provider value={{ txData, invData, loading, loadAll, addTx, deleteTx, addInv, deleteInv, totals }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)