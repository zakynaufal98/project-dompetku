import { useState, useRef, useEffect, useMemo } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { toPng } from 'html-to-image'

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
    
    // Use exportDate if available, else fallback
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
    
    // 👇 TOP 3 SEKARANG OTOMATIS RAPI KARENA t.cat MURNI INDUKNYA SAJA
    const catMap = {}
    expenses.forEach(t => { 
      const mainCat = t.cat || 'Lainnya'
      catMap[mainCat] = (catMap[mainCat] || 0) + t.amount 
    })
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

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

    const combinedTx = [
      ...txData.filter(t => t.cat !== 'Transfer' && filterFn(t)).map(t => ({
        ...t, 
        displayType: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran', 
        // 👇 PERBAIKAN: Menampilkan Kategori - Sub Kategori di dalam Tabel Laporan
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
      masuk, keluar, invest, netto, savingsRate, topCategories, 
      insightText: insight, insightColor: insightCol, 
      allTransaksi: combinedTx, topTransaksi: combinedTx.slice(0, 15), periodeText: pText,
      saldoSaatIni: totals?.saldo || 0
    }
  }, [txData, invData, isYearly, totals])

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
            
            <tr>
              <td colspan="5" style="background-color: ${reportData.insightColor}15; color: ${reportData.insightColor}; font-weight: bold; padding: 15px; border-radius: 8px; border-left: 4px solid ${reportData.insightColor};">
                💡 EXECUTIVE INSIGHT: ${reportData.insightText}
              </td>
            </tr>
            <tr><td colspan="5"></td></tr>

            <!-- TABEL RINGKASAN DISESUAIKAN DENGAN DASHBOARD -->
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px; border-radius: 6px 6px 0 0;">📈 RINGKASAN ARUS KAS</td></tr>
            <tr>
              <td colspan="2" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold;">Pemasukan</td>
              <td colspan="3" style="background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold; color: #10B981;">+ ${formatRp(reportData.masuk)}</td>
            </tr>
            <tr>
              <td colspan="2" style="background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold;">Pengeluaran</td>
              <td colspan="3" style="background-color: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 10px; font-weight: bold; color: #E11D48;">- ${formatRp(reportData.keluar)}</td>
            </tr>
            <tr>
              <td colspan="2" style="background-color: #EEF2FF; padding: 10px; font-weight: bold;">Arus Kas Bersih</td>
              <td colspan="3" style="background-color: #EEF2FF; padding: 10px; font-weight: bold; color: ${reportData.netto >= 0 ? '#10B981' : '#E11D48'};">${formatRp(reportData.netto)}</td>
            </tr>
            <tr><td colspan="5"></td></tr>

            <!-- TABEL KATEGORI TERBESAR -->
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px; border-radius: 6px 6px 0 0;">🔥 TOP 3 SUMBER PENGELUARAN</td></tr>
            ${reportData.topCategories.map((c, i) => `
              <tr>
                <td colspan="2" style="border-bottom: 1px solid #E2E8F0; padding: 10px;">${i+1}. ${c[0]}</td>
                <td colspan="3" style="border-bottom: 1px solid #E2E8F0; font-weight: bold; color: #E11D48;">${formatRp(c[1])}</td>
              </tr>
            `).join('')}
            ${reportData.topCategories.length === 0 ? '<tr><td colspan="5" style="padding: 10px;">Belum ada pengeluaran dicatat.</td></tr>' : ''}
            <tr><td colspan="5"></td></tr>

            <!-- TABEL TRANSAKSI DETAIL -->
            <tr><td colspan="5" style="background-color: #1E1B4B; color: white; font-weight: bold; padding: 10px; border-radius: 6px 6px 0 0;">📋 RINCIAN TRANSAKSI</td></tr>
            <tr style="background-color: #F1F5F9; color: #334155; font-weight: bold;">
              <th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Tanggal</th>
              <th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Tipe</th>
              <th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Kategori</th>
              <th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: left;">Deskripsi</th>
              <th style="border-bottom: 2px solid #CBD5E1; padding: 10px; text-align: right;">Nominal</th>
            </tr>
            ${reportData.allTransaksi.map(t => `
              <tr>
                <td style="border-bottom: 1px solid #E2E8F0; padding: 8px;">${t.date}</td>
                <td style="border-bottom: 1px solid #E2E8F0; padding: 8px; color: ${t.color}; font-weight: bold;">${t.displayType}</td>
                <td style="border-bottom: 1px solid #E2E8F0; padding: 8px;">${t.displayCat}</td>
                <td style="border-bottom: 1px solid #E2E8F0; padding: 8px; color: #64748B;">${t.desc}</td>
                <td style="border-bottom: 1px solid #E2E8F0; padding: 8px; text-align: right; font-weight: bold; color: ${t.color};">${formatRp(t.amount)}</td>
              </tr>
            `).join('')}
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

  // --- 2. PDF REPORT ---
  const handleExportPDF = async () => {
    setIsOpen(false)
    const element = document.getElementById('pdf-formal-template')
    if (!element) return

    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2, fontEmbedCSS: '' })
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Executive_Report_${isYearly ? 'Tahunan' : 'Bulanan'}.pdf`)
    } catch (error) {
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
            <div><p>PDF Executive</p><p className="text-[10px] text-muted2 font-normal">Cetak Dokumen Resmi</p></div>
          </button>
          <button onClick={handleExportExcel} className="w-full text-left px-4 py-3.5 text-sm font-semibold text-text hover:bg-bg hover:text-income flex items-center gap-3 transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileSpreadsheet size={18} /></div>
            <div><p>Excel Analitik</p><p className="text-[10px] text-muted2 font-normal">Tabel Analisis & Riwayat</p></div>
          </button>
        </div>
      )}

      {/* --- TEMPLATE PDF RAHASIA --- */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div id="pdf-formal-template" className="w-[800px] bg-white p-12 text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          
          {/* HEADER DOKUMEN */}
          <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-8 rounded-2xl mb-8 shadow-xl">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full"></div>
                </div>
                DompetKu Pro
              </h1>
              <p className="text-indigo-200 font-medium tracking-widest text-xs uppercase">Laporan Analisis Finansial</p>
            </div>
            <div className="text-right bg-white/10 p-4 rounded-xl backdrop-blur-md">
              <p className="text-indigo-200 font-bold text-[10px] uppercase tracking-widest mb-1">Periode</p>
              <p className="text-white font-black text-2xl">{reportData.periodeText}</p>
            </div>
          </div>

          {/* INSIGHT AI */}
          <div className="mb-8 p-6 rounded-2xl border-l-8 shadow-sm bg-slate-50" style={{ borderLeftColor: reportData.insightColor }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Kesimpulan Eksekutif</p>
            <p className="font-semibold text-xl leading-snug" style={{ color: reportData.insightColor }}>" {reportData.insightText} "</p>
          </div>

          {/* 👇 PERUBAHAN GRID: DISESUAIKAN DENGAN KARTU DASHBOARD 👇 */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-200">
              <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Saat Ini</p>
              <p className="text-xl font-black text-indigo-700">{formatRp(reportData.saldoSaatIni)}</p>
            </div>
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan</p>
              <p className="text-xl font-black text-emerald-700">+{formatRp(reportData.masuk)}</p>
            </div>
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
              <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran</p>
              <p className="text-xl font-black text-rose-700">-{formatRp(reportData.keluar)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Arus Kas Periode</p>
              <p className={`text-xl font-black ${reportData.netto >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>{formatRp(reportData.netto)}</p>
            </div>
          </div>

          {/* ANALISIS MENDALAM */}
          <div className="flex gap-6 mb-8">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Top 3 Pengeluaran</h3>
              {reportData.topCategories.length === 0 ? <p className="text-sm text-slate-400">Belum ada data.</p> : (
                <div className="space-y-4">
                  {reportData.topCategories.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span className="text-slate-700">{c[0]}</span>
                        <span className="text-rose-600">{formatRp(c[1])}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full" style={{ width: `${(c[1]/reportData.keluar)*100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-64 bg-slate-800 rounded-2xl p-6 text-white flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Savings Rate</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-emerald-400">{reportData.savingsRate}%</span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Persentase uang yang berhasil diamankan dari total pemasukan periode ini.
              </p>
            </div>
          </div>

          {/* TABEL TRANSAKSI TERBARU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Riwayat Transaksi</h3>
            </div>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-6 font-bold text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="py-3 px-6 font-bold text-xs uppercase tracking-wider">Kategori</th>
                  <th className="py-3 px-6 font-bold text-xs uppercase tracking-wider">Deskripsi</th>
                  <th className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topTransaksi.map((t, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-500 font-medium">{t.date}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{t.displayCat}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{t.displayType}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{t.desc}</td>
                    <td className="py-4 px-6 text-right font-black" style={{ color: t.color }}>
                      {t.displayType.includes('Pengeluaran') ? '-' : '+'}{formatRp(t.amount)}
                    </td>
                  </tr>
                ))}
                {reportData.topTransaksi.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">Belum ada transaksi pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-12 text-center text-slate-400 text-[10px] font-bold tracking-widest border-t border-slate-200 pt-6 uppercase">
            Dihasilkan secara otomatis oleh sistem DompetKu Pro &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}