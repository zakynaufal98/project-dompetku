import { useState, useMemo, useRef, useEffect } from 'react'
import { Bell, CheckCircle2, AlertCircle, Clock, Check } from 'lucide-react'
import { useData } from '../context/DataContext'
import { fmtShort } from '../lib/utils'

export default function NotificationMenu() {
  const { billData, txData } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = useMemo(() => {
    const notifs = []
    
    const now = new Date()
    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    billData.filter(b => !b.is_lunas).forEach(b => {
      const dateOnly = b.jatuh_tempo.split('T')[0]
      const [y, m, d] = dateOnly.split('-')
      const dueTime = new Date(Number(y), Number(m) - 1, Number(d)).getTime()
      const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        notifs.push({
          id: `overdue-${b.id}`,
          type: 'danger',
          icon: <AlertCircle size={16} className="text-expense" />,
          title: 'Tagihan Terlewat!',
          desc: `${b.nama_tagihan} (${fmtShort(b.amount)}) sudah terlambat ${Math.abs(diffDays)} hari.`,
          date: dueTime,
          priority: 1
        })
      } else if (diffDays === 0) {
        notifs.push({
          id: `due-${b.id}`,
          type: 'warning',
          icon: <Clock size={16} className="text-gold" />,
          title: 'Jatuh Tempo Hari Ini!',
          desc: `${b.nama_tagihan} (${fmtShort(b.amount)}) harus dibayar hari ini.`,
          date: dueTime,
          priority: 2
        })
      } else if (diffDays <= 3) {
        notifs.push({
          id: `due-${b.id}`,
          type: 'warning',
          icon: <Clock size={16} className="text-gold" />,
          title: 'Reminder Tagihan',
          desc: `${b.nama_tagihan} (${fmtShort(b.amount)}) jatuh tempo dalam ${diffDays} hari.`,
          date: dueTime,
          priority: 3
        })
      }
    })

    const threeDaysAgoTime = todayTime - (3 * 24 * 60 * 60 * 1000)

    txData.forEach(t => {
      const dateOnly = t.date.split('T')[0]
      const [y, m, d] = dateOnly.split('-')
      const txTime = new Date(Number(y), Number(m) - 1, Number(d)).getTime()

      if (t.type === 'out' && t.desc?.toLowerCase().includes('bayar tagihan') && txTime >= threeDaysAgoTime) {
        notifs.push({
          id: `paid-${t.id}`,
          type: 'success',
          icon: <CheckCircle2 size={16} className="text-invest" />,
          title: 'Pembayaran Berhasil',
          desc: `${t.desc} senilai ${fmtShort(t.amount)} telah dicatat.`,
          date: txTime,
          priority: 4
        })
      }
    })

    return notifs.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.date - a.date 
    })
  }, [billData, txData])

  // Menghitung jumlah tagihan yang belum dibayar (Danger + Warning) untuk header popup
  const unreadCount = notifications.filter(n => n.type === 'danger' || n.type === 'warning').length

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted hover:text-text transition-colors rounded-full hover:bg-bg cursor-pointer"
      >
        <Bell size={20} strokeWidth={2} />
        {/* 👇 UPDATE: Menampilkan angka total notifikasi, tanpa animasi berkedip 👇 */}
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-expense rounded-full border-2 border-surface">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
          
          <div className="fixed top-[75px] left-4 right-4 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-3 sm:w-[350px] bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-up origin-top sm:origin-top-right">
            
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg/50">
              <h3 className="font-bold text-sm text-text">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="bg-expense-light text-expense text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} Tagihan
                </span>
              )}
            </div>

            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-border last:border-0 hover:bg-bg transition-colors flex gap-3 ${
                      n.type === 'danger' ? 'bg-expense-light/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {n.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${
                        n.type === 'danger' ? 'text-expense' : n.type === 'warning' ? 'text-gold' : 'text-text-2'
                      }`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-muted font-medium mt-1 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 flex flex-col items-center justify-center text-center opacity-60">
                  <Check size={32} className="text-muted2 mb-2" />
                  <p className="text-sm font-bold text-text-2">Semua Aman!</p>
                  <p className="text-xs text-muted font-medium mt-1">Tidak ada tagihan atau pemberitahuan baru.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}