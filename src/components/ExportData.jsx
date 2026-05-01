import { useState, useRef, useEffect, useMemo } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { useData } from '../context/DataContext'

export default function ExportData({ isYearly = false }) {
  const { txData = [], invData = [], totals } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportDate, setExportDate] = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false)
    }
    const handleExportDate = (e) => setExportDate(e.detail)
    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("updateExportDate", handleExportDate)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("updateExportDate", handleExportDate)
    }
  }, [])

  const reportData = useMemo(() => {
    const now = new Date()
    const fallbackYear = String(now.getFullYear())
    const fallbackYM = `${fallbackYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const targetPeriod = exportDate || (isYearly ? fallbackYear : fallbackYM)
    const filterFn = (t) => t.date?.startsWith(targetPeriod)
    
    const expenses = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && filterFn(t))
    const incomes = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && filterFn(t))
    const investments = invData.filter(t => t.action === 'beli' && filterFn(t))
    
    const keluar = expenses.reduce((s, t) => s + t.amount, 0)
    const masuk = incomes.reduce((s, t) => s + t.amount, 0)
    const invest = investments.reduce((s, t) => s + t.amount, 0)
    
    const netto = masuk - keluar
    const savingsRate = masuk > 0 ? (((netto > 0 ? netto : 0) + invest) / masuk * 100).toFixed(1) : 0
    
    const catMap = {}
    expenses.forEach(t => { 
      const mainCat = t.cat || 'Lainnya'
      catMap[mainCat] = (catMap[mainCat] || 0) + t.amount 
    })
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const allCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1])

    const pText = isYearly ? `Tahun ${targetPeriod}` : `Bulan ${targetPeriod}`
    
    let insight = `Luar biasa! Arus kas sangat sehat di ${pText.toLowerCase()}.`
    let insightCol = "#10B981" 
    
    if (keluar > masuk) {
      insight = `Kritis! Kamu defisit sebesar Rp ${(keluar - masuk).toLocaleString('id-ID')} di ${pText.toLowerCase()}. Evaluasi segera pengeluaranmu!`
      insightCol = "#E11D48" 
    } else if (keluar > (masuk * 0.8)) {
      insight = `Waspada! Pengeluaranmu mencapai ${((keluar/masuk)*100).toFixed(1)}% dari pemasukan. Tingkatkan porsi tabungan.`
      insightCol = "#F59E0B" 
    } else if (savingsRate >= 20) {
      insight = `Level Pro! Tingkat tabunganmu mencapai ${savingsRate}%. Kebebasan finansial makin dekat!`
      insightCol = "#0EA5E9" 
    }

    // Income categories
    const inCatMap = {}
    incomes.forEach(t => { inCatMap[t.cat || 'Lainnya'] = (inCatMap[t.cat || 'Lainnya'] || 0) + t.amount })
    const incomeCategories = Object.entries(inCatMap).sort((a, b) => b[1] - a[1])

    const combinedTx = [
      ...txData.filter(t => t.cat !== 'Transfer' && filterFn(t)).map(t => ({
        ...t, 
        displayType: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran', 
        displayCat: t.sub_cat ? `${t.cat || 'Lainnya'} - ${t.sub_cat}` : (t.cat || 'Lainnya'), 
        color: t.type === 'in' ? '#10B981' : '#E11D48'
      })),
      ...invData.filter(t => filterFn(t)).map(t => ({
        ...t, 
        displayType: t.action === 'beli' ? 'Beli Aset' : 'Jual Aset', 
        displayCat: `Investasi (${t.invType || 'Aset'})`, 
        desc: t.desc || `${t.action === 'beli' ? 'Pembelian' : 'Penjualan'} ${t.subType || t.invType}`, 
        color: t.action === 'beli' ? '#0EA5E9' : '#10B981'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    return { 
      masuk, keluar, invest, netto, savingsRate, topCategories, allCategories, incomeCategories,
      insightText: insight, insightColor: insightCol, 
      allTransaksi: combinedTx, periodeText: pText,
      saldoSaatIni: totals?.saldo || 0, totalTx: combinedTx.length
    }
  }, [txData, invData, isYearly, totals, exportDate])

  const formatRp = (num) => `Rp ${num.toLocaleString('id-ID')}`

  // --- 1. EXCEL REPORT ---
  const handleExportExcel = () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table border="0" cellpadding="5" cellspacing="0" style="width:100%; max-width:800px;">
            <tr><td colspan="5" style="font-size: 28px; font-weight: bold; color: #312E81; padding-bottom: 10px;">📊 LAPORAN KEUANGAN DOMPETKU PRO</td></tr>
            <tr><td colspan="5" style="color: #64748B; font-size: 14px; padding-bottom: 20px;">Periode: ${reportData.periodeText.toUpperCase()}</td></tr>
            <tr><td colspan="5" style="background-color: ${reportData.insightColor}15; color: ${reportData.insightColor}; font-weight: bold; padding: 15px; border-left: 4px solid ${reportData.insightColor};">💡 EXECUTIVE INSIGHT: ${reportData.insightText}</td></tr>
            <tr><td colspan="5"></td></tr>
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px;">📈 RINGKASAN ARUS KAS</td></tr>
            <tr><td colspan="2" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold;">Pemasukan</td><td colspan="3" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold; color: #10B981;">+ ${formatRp(reportData.masuk)}</td></tr>
            <tr><td colspan="2" style="background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold;">Pengeluaran</td><td colspan="3" style="background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold; color: #E11D48;">- ${formatRp(reportData.keluar)}</td></tr>
            <tr><td colspan="2" style="background-color: #EEF2FF; padding: 10px; font-weight: bold;">Arus Kas Bersih</td><td colspan="3" style="background-color: #EEF2FF; padding: 10px; font-weight: bold; color: ${reportData.netto >= 0 ? '#10B981' : '#E11D48'};">${formatRp(reportData.netto)}</td></tr>
            <tr><td colspan="5"></td></tr>
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px;">🔥 TOP SUMBER PENGELUARAN</td></tr>
            ${reportData.topCategories.map((c, i) => `<tr><td colspan="2" style="border-bottom: 1px solid #E2E8F0; padding: 10px;">${i+1}. ${c[0]}</td><td colspan="3" style="border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #E11D48;">${formatRp(c[1])}</td></tr>`).join('')}
            <tr><td colspan="5"></td></tr>
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px;">📋 RINCIAN TRANSAKSI</td></tr>
            <tr style="background-color: #F1F5F9; color: #334155; font-weight: bold;"><th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Tanggal</th><th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Tipe</th><th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Kategori</th><th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Deskripsi</th><th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: right;">Nominal</th></tr>
            ${reportData.allTransaksi.map(t => `<tr><td style="border-bottom: 1px solid #E2E8F0; padding: 8px;">${t.date}</td><td style="border-bottom: 1px solid #E2E8F0; padding: 8px; color: ${t.color}; font-weight: bold;">${t.displayType}</td><td style="border-bottom: 1px solid #E2E8F0; padding: 8px;">${t.displayCat}</td><td style="border-bottom: 1px solid #E2E8F0; padding: 8px; color: #64748B;">${t.desc}</td><td style="border-bottom: 1px solid #E2E8F0; padding: 8px; text-align: right; font-weight: bold; color: ${t.color};">${formatRp(t.amount)}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Analisis_DompetKu_${isYearly ? 'Tahunan' : 'Bulanan'}.xls`
    link.click()
  }

  // --- 2. PDF REPORT (PROPER MULTI-PAGE jsPDF) ---
  const handleExportPDF = async () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')
    
    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth()
      const H = pdf.internal.pageSize.getHeight()
      let y = 0

      const addFooter = () => {
        pdf.setFontSize(7)
        pdf.setTextColor(150)
        pdf.text(`Dihasilkan otomatis oleh DompetKu Pro — ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, H - 8, { align: 'center' })
      }

      const checkPage = (need) => {
        if (y + need > H - 20) { addFooter(); pdf.addPage(); y = 20; }
      }

      // === PAGE 1: HEADER & SUMMARY ===
      // Header bar
      pdf.setFillColor(30, 27, 75) // indigo-950
      pdf.roundedRect(10, 10, W - 20, 40, 4, 4, 'F')
      pdf.setFontSize(22)
      pdf.setTextColor(255)
      pdf.setFont(undefined, 'bold')
      pdf.text('DompetKu Pro', 20, 30)
      pdf.setFontSize(9)
      pdf.setTextColor(180, 180, 220)
      pdf.text('LAPORAN ANALISIS FINANSIAL', 20, 38)
      pdf.setFontSize(16)
      pdf.setTextColor(255)
      pdf.text(reportData.periodeText, W - 20, 33, { align: 'right' })

      y = 60

      // Executive Insight
      const insightR = reportData.insightColor === '#E11D48' ? 225 : reportData.insightColor === '#F59E0B' ? 245 : reportData.insightColor === '#0EA5E9' ? 14 : 16
      const insightG = reportData.insightColor === '#E11D48' ? 29 : reportData.insightColor === '#F59E0B' ? 158 : reportData.insightColor === '#0EA5E9' ? 165 : 185
      const insightB = reportData.insightColor === '#E11D48' ? 72 : reportData.insightColor === '#F59E0B' ? 11 : reportData.insightColor === '#0EA5E9' ? 233 : 129
      
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(10, y, W - 20, 22, 3, 3, 'F')
      pdf.setDrawColor(insightR, insightG, insightB)
      pdf.setLineWidth(1.5)
      pdf.line(10, y, 10, y + 22)
      pdf.setFontSize(7)
      pdf.setTextColor(150)
      pdf.text('KESIMPULAN EKSEKUTIF', 16, y + 7)
      pdf.setFontSize(9)
      pdf.setTextColor(insightR, insightG, insightB)
      const lines = pdf.splitTextToSize(reportData.insightText, W - 40)
      pdf.text(lines, 16, y + 14)
      y += 30

      // Summary Cards
      const cardW = (W - 30) / 4
      const cards = [
        { label: 'SALDO SAAT INI', value: formatRp(reportData.saldoSaatIni), color: [79, 70, 229] },
        { label: 'PEMASUKAN', value: `+${formatRp(reportData.masuk)}`, color: [16, 185, 129] },
        { label: 'PENGELUARAN', value: `-${formatRp(reportData.keluar)}`, color: [225, 29, 72] },
        { label: 'ARUS KAS BERSIH', value: formatRp(reportData.netto), color: reportData.netto >= 0 ? [16, 185, 129] : [225, 29, 72] },
      ]
      cards.forEach((c, i) => {
        const x = 10 + i * (cardW + 3.3)
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, y, cardW, 26, 3, 3, 'F')
        pdf.setFontSize(6)
        pdf.setTextColor(c.color[0], c.color[1], c.color[2])
        pdf.text(c.label, x + 4, y + 8)
        pdf.setFontSize(11)
        pdf.setTextColor(30, 41, 59)
        pdf.setFont(undefined, 'bold')
        pdf.text(c.value, x + 4, y + 19)
        pdf.setFont(undefined, 'normal')
      })
      y += 34

      // Savings Rate
      pdf.setFillColor(79, 70, 229)
      pdf.roundedRect(10, y, (W - 20) * 0.35, 22, 3, 3, 'F')
      pdf.setFontSize(7)
      pdf.setTextColor(180, 180, 240)
      pdf.text('SAVINGS RATE', 16, y + 8)
      pdf.setFontSize(18)
      pdf.setTextColor(255)
      pdf.setFont(undefined, 'bold')
      pdf.text(`${reportData.savingsRate}%`, 16, y + 18)
      pdf.setFont(undefined, 'normal')

      // Top Categories Box
      const topX = 10 + (W - 20) * 0.38
      const topW = (W - 20) * 0.62
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(topX, y, topW, 22, 3, 3, 'F')
      pdf.setFontSize(7)
      pdf.setTextColor(150)
      pdf.text('TOP PENGELUARAN', topX + 4, y + 8)
      reportData.topCategories.slice(0, 3).forEach((c, i) => {
        pdf.setFontSize(8)
        pdf.setTextColor(71, 85, 105)
        pdf.text(`${i + 1}. ${c[0]}`, topX + 4, y + 14 + i * 3)
        pdf.setTextColor(225, 29, 72)
        pdf.text(formatRp(c[1]), topX + topW - 4, y + 14 + i * 3, { align: 'right' })
      })
      y += 30

      // === KATEGORI BREAKDOWN TABLE ===
      checkPage(40)
      pdf.setFillColor(30, 27, 75)
      pdf.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
      pdf.setFontSize(8)
      pdf.setTextColor(255)
      pdf.setFont(undefined, 'bold')
      pdf.text('📊  DISTRIBUSI PENGELUARAN PER KATEGORI', 16, y + 5.5)
      pdf.setFont(undefined, 'normal')
      y += 12

      if (reportData.allCategories.length > 0) {
        // Table header
        pdf.setFillColor(241, 245, 249)
        pdf.rect(10, y, W - 20, 7, 'F')
        pdf.setFontSize(7)
        pdf.setTextColor(100, 116, 139)
        pdf.setFont(undefined, 'bold')
        pdf.text('Kategori', 16, y + 5)
        pdf.text('Nominal', W / 2 + 10, y + 5)
        pdf.text('Persentase', W - 25, y + 5, { align: 'right' })
        pdf.setFont(undefined, 'normal')
        y += 9

        reportData.allCategories.forEach(([cat, val]) => {
          checkPage(8)
          const pct = reportData.keluar > 0 ? (val / reportData.keluar * 100).toFixed(1) : 0
          pdf.setFontSize(8)
          pdf.setTextColor(71, 85, 105)
          pdf.text(cat, 16, y + 4)
          pdf.setTextColor(225, 29, 72)
          pdf.setFont(undefined, 'bold')
          pdf.text(formatRp(val), W / 2 + 10, y + 4)
          pdf.setFont(undefined, 'normal')
          pdf.setTextColor(100)
          pdf.text(`${pct}%`, W - 25, y + 4, { align: 'right' })
          // Mini progress bar
          const barW = 30
          const barX = W - 22 - barW
          pdf.setFillColor(241, 245, 249)
          pdf.roundedRect(barX, y + 1, barW, 2.5, 1, 1, 'F')
          pdf.setFillColor(225, 29, 72)
          pdf.roundedRect(barX, y + 1, barW * (Number(pct) / 100), 2.5, 1, 1, 'F')
          pdf.setDrawColor(226, 232, 240)
          pdf.line(10, y + 7, W - 10, y + 7)
          y += 8
        })
        y += 5
      }

      // === INCOME BREAKDOWN ===
      if (reportData.incomeCategories.length > 0) {
        checkPage(30)
        pdf.setFillColor(16, 185, 129)
        pdf.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
        pdf.setFontSize(8)
        pdf.setTextColor(255)
        pdf.setFont(undefined, 'bold')
        pdf.text('💰  SUMBER PEMASUKAN', 16, y + 5.5)
        pdf.setFont(undefined, 'normal')
        y += 12

        reportData.incomeCategories.forEach(([cat, val]) => {
          checkPage(8)
          pdf.setFontSize(8)
          pdf.setTextColor(71, 85, 105)
          pdf.text(cat, 16, y + 4)
          pdf.setTextColor(16, 185, 129)
          pdf.setFont(undefined, 'bold')
          pdf.text(formatRp(val), W - 20, y + 4, { align: 'right' })
          pdf.setFont(undefined, 'normal')
          pdf.setDrawColor(226, 232, 240)
          pdf.line(10, y + 7, W - 10, y + 7)
          y += 8
        })
        y += 5
      }

      // === TRANSACTION DETAIL TABLE ===
      checkPage(20)
      pdf.setFillColor(30, 27, 75)
      pdf.roundedRect(10, y, W - 20, 8, 2, 2, 'F')
      pdf.setFontSize(8)
      pdf.setTextColor(255)
      pdf.setFont(undefined, 'bold')
      pdf.text(`📋  RIWAYAT TRANSAKSI (${reportData.totalTx} transaksi)`, 16, y + 5.5)
      pdf.setFont(undefined, 'normal')
      y += 12

      // Table header
      pdf.setFillColor(241, 245, 249)
      pdf.rect(10, y, W - 20, 7, 'F')
      pdf.setFontSize(6.5)
      pdf.setTextColor(100, 116, 139)
      pdf.setFont(undefined, 'bold')
      pdf.text('Tanggal', 14, y + 5)
      pdf.text('Tipe', 42, y + 5)
      pdf.text('Kategori', 68, y + 5)
      pdf.text('Deskripsi', 112, y + 5)
      pdf.text('Nominal', W - 14, y + 5, { align: 'right' })
      pdf.setFont(undefined, 'normal')
      y += 9

      reportData.allTransaksi.forEach((t, i) => {
        checkPage(8)
        const isAlt = i % 2 === 0
        if (isAlt) { pdf.setFillColor(252, 252, 253); pdf.rect(10, y - 1, W - 20, 7, 'F') }
        
        pdf.setFontSize(7)
        pdf.setTextColor(100, 116, 139)
        pdf.text(t.date || '', 14, y + 4)
        
        const r = t.color === '#10B981' ? 16 : t.color === '#0EA5E9' ? 14 : 225
        const g = t.color === '#10B981' ? 185 : t.color === '#0EA5E9' ? 165 : 29
        const b = t.color === '#10B981' ? 129 : t.color === '#0EA5E9' ? 233 : 72
        pdf.setTextColor(r, g, b)
        pdf.setFont(undefined, 'bold')
        pdf.text((t.displayType || '').substring(0, 12), 42, y + 4)
        pdf.setFont(undefined, 'normal')
        
        pdf.setTextColor(71, 85, 105)
        pdf.text((t.displayCat || '').substring(0, 22), 68, y + 4)
        pdf.setTextColor(100, 116, 139)
        pdf.text((t.desc || '').substring(0, 24), 112, y + 4)
        
        pdf.setTextColor(r, g, b)
        pdf.setFont(undefined, 'bold')
        const sign = t.displayType?.includes('Pengeluaran') ? '-' : '+'
        pdf.text(`${sign}${formatRp(t.amount)}`, W - 14, y + 4, { align: 'right' })
        pdf.setFont(undefined, 'normal')
        
        y += 7
      })

      addFooter()
      pdf.save(`Executive_Report_${isYearly ? 'Tahunan' : 'Bulanan'}.pdf`)
    } catch (error) {
      console.error(error)
      alert('Gagal mengekspor PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative z-50" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} disabled={isExporting} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        <span>{isExporting ? 'Memproses...' : `Export Laporan ${isYearly ? 'Tahunan' : 'Bulanan'}`}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          <button onClick={handleExportPDF} className="w-full text-left px-4 py-3.5 text-sm font-semibold text-text hover:bg-bg hover:text-income flex items-center gap-3 transition-colors border-b border-border group">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={18} /></div>
            <div><p>PDF Executive</p><p className="text-[10px] text-muted2 font-normal">Multi-halaman, Tabel Profesional</p></div>
          </button>
          <button onClick={handleExportExcel} className="w-full text-left px-4 py-3.5 text-sm font-semibold text-text hover:bg-bg hover:text-income flex items-center gap-3 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileSpreadsheet size={18} /></div>
            <div><p>Excel Analitik</p><p className="text-[10px] text-muted2 font-normal">Tabel Analisis & Riwayat</p></div>
          </button>
        </div>
      )}
    </div>
  )
}