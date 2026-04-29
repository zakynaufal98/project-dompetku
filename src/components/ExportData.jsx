import { useState, useRef, useEffect, useMemo } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { useData } from '../context/DataContext'
import { toPng } from 'html-to-image'

export default function ExportData({ isYearly = false }) {
  const { txData = [], invData = [] } = useData()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const menuRef = useRef(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // MENGHITUNG DATA ADVANCE (Bulanan/Tahunan)
  const reportData = useMemo(() => {
    const now = new Date()
    const currYear = String(now.getFullYear())
    const currYM = `${currYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // Filter dinamis berdasarkan prop isYearly
    const filterFn = (t) => t.date?.startsWith(isYearly ? currYear : currYM)
    
    const expenses = txData.filter(t => t.type === 'out' && t.cat !== 'Transfer' && filterFn(t))
    const incomes = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && filterFn(t))
    const investments = invData.filter(t => t.action === 'beli' && filterFn(t))
    
    const keluar = expenses.reduce((s, t) => s + t.amount, 0)
    const masuk = incomes.reduce((s, t) => s + t.amount, 0)
    const invest = investments.reduce((s, t) => s + t.amount, 0)
    
    // Analisis Finansial Lanjutan
    const netto = masuk - keluar
    const savingsRate = masuk > 0 ? (((netto > 0 ? netto : 0) + invest) / masuk * 100).toFixed(1) : 0
    
    // Mencari Top 3 Kategori Pengeluaran (Agregasi Data)
    const catMap = {}
    expenses.forEach(t => { catMap[t.cat] = (catMap[t.cat] || 0) + t.amount })
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    const pText = isYearly ? `Tahun ${currYear}` : `Bulan Ini (${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`
    
    // Logika Insight Tingkat Lanjut
    let insight = `Luar biasa! Arus kas sangat sehat di ${pText.toLowerCase()}.`
    let insightCol = "#10B981" // Emerald
    
    if (keluar > masuk) {
      insight = `Kritis! Kamu defisit sebesar Rp ${(keluar - masuk).toLocaleString('id-ID')} di ${pText.toLowerCase()}. Evaluasi segera pengeluaranmu!`
      insightCol = "#E11D48" // Rose
    } else if (keluar > (masuk * 0.8)) {
      insight = `Waspada! Pengeluaranmu mencapai ${((keluar/masuk)*100).toFixed(1)}% dari pemasukan. Tingkatkan porsi tabungan.`
      insightCol = "#F59E0B" // Amber
    } else if (savingsRate >= 20) {
      insight = `Level Pro! Tingkat tabunganmu mencapai ${savingsRate}%. Kebebasan finansial makin dekat!`
      insightCol = "#0EA5E9" // Sky Blue
    }

    const combinedTx = [
      ...txData.filter(t => t.cat !== 'Transfer' && filterFn(t)).map(t => ({
        ...t, 
        displayType: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        displayCat: t.cat,
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
      allTransaksi: combinedTx, topTransaksi: combinedTx.slice(0, 15), periodeText: pText
    }
  }, [txData, invData, isYearly])

  const formatRp = (num) => `Rp ${num.toLocaleString('id-ID')}`

  // --- 1. EXCEL REPORT (ADVANCED) ---
  const handleExportExcel = () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data.')

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <table border="0" cellpadding="5">
            <tr><td colspan="5" style="font-size: 24px; font-weight: bold; color: #4F46E5;">LAPORAN ANALISIS KEUANGAN PRO</td></tr>
            <tr><td colspan="5" style="color: #64748B;">Periode: ${reportData.periodeText.toUpperCase()}</td></tr>
            <tr><td colspan="5"></td></tr>
            
            <tr>
              <td colspan="5" style="background-color: ${reportData.insightColor}20; color: ${reportData.insightColor}; font-weight: bold; padding: 15px; border-radius: 8px;">
                💡 EXECUTIVE INSIGHT: ${reportData.insightText}
              </td>
            </tr>
            <tr><td colspan="5"></td></tr>

            <!-- TABEL RINGKASAN -->
            <tr style="background-color: #F8FAFC; font-weight: bold;"><td colspan="5" style="border-bottom: 2px solid #CBD5E1;">RINGKASAN ARUS KAS</td></tr>
            <tr>
              <td colspan="2" style="font-weight: bold; padding: 8px;">Total Pemasukan</td>
              <td colspan="3" style="font-weight: bold; color: #10B981;">${formatRp(reportData.masuk)}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-weight: bold; padding: 8px;">Total Pengeluaran</td>
              <td colspan="3" style="font-weight: bold; color: #E11D48;">${formatRp(reportData.keluar)}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-weight: bold; padding: 8px;">Total Investasi Aktif</td>
              <td colspan="3" style="font-weight: bold; color: #0EA5E9;">${formatRp(reportData.invest)}</td>
            </tr>
            <tr>
              <td colspan="2" style="background-color: #F1F5F9; font-weight: bold; padding: 8px;">Sisa Kas Bersih (Netto)</td>
              <td colspan="3" style="background-color: #F1F5F9; font-weight: bold; color: ${reportData.netto >= 0 ? '#10B981' : '#E11D48'};">${formatRp(reportData.netto)}</td>
            </tr>
            <tr><td colspan="5"></td></tr>

            <!-- TABEL KATEGORI TERBESAR -->
            <tr style="background-color: #F8FAFC; font-weight: bold;"><td colspan="5" style="border-bottom: 2px solid #CBD5E1;">TOP 3 SUMBER PENGELUARAN</td></tr>
            ${reportData.topCategories.map((c, i) => `
              <tr>
                <td colspan="2" style="padding: 8px;">${i+1}. ${c[0]}</td>
                <td colspan="3" style="font-weight: bold; color: #E11D48;">${formatRp(c[1])}</td>
              </tr>
            `).join('')}
            ${reportData.topCategories.length === 0 ? '<tr><td colspan="5">Belum ada pengeluaran dicatat.</td></tr>' : ''}
            <tr><td colspan="5"></td></tr>

            <!-- TABEL TRANSAKSI DETAIL -->
            <tr style="background-color: #4F46E5; color: white; font-weight: bold;">
              <th style="border: 1px solid #CBD5E1; padding: 10px;">Tanggal</th>
              <th style="border: 1px solid #CBD5E1; padding: 10px;">Tipe</th>
              <th style="border: 1px solid #CBD5E1; padding: 10px;">Kategori</th>
              <th style="border: 1px solid #CBD5E1; padding: 10px;">Deskripsi</th>
              <th style="border: 1px solid #CBD5E1; padding: 10px;">Nominal</th>
            </tr>
            ${reportData.allTransaksi.map(t => `
              <tr>
                <td style="border: 1px solid #E2E8F0;">${t.date}</td>
                <td style="border: 1px solid #E2E8F0; color: ${t.color}; font-weight: bold;">${t.displayType}</td>
                <td style="border: 1px solid #E2E8F0;">${t.displayCat}</td>
                <td style="border: 1px solid #E2E8F0;">${t.desc}</td>
                <td style="border: 1px solid #E2E8F0; text-align: right; font-weight: bold;">${formatRp(t.amount)}</td>
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

  // --- 2. PDF REPORT (ADVANCED) ---
  const handleExportPDF = async () => {
    setIsOpen(false)
    const element = document.getElementById('pdf-formal-template')
    if (!element) return

    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      // fontEmbedCSS: '' mencegah error CORS dari Google Fonts saat generate
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

      {/* --- TEMPLATE PDF RAHASIA (TIDAK TERLIHAT DI LAYAR) --- */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div id="pdf-formal-template" className="w-[800px] bg-white p-12 text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          
          {/* HEADER DOKUMEN */}
          <div className="flex justify-between items-end border-b-4 border-indigo-600 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-indigo-600 tracking-tighter mb-1">DompetKu <span className="text-slate-800">Pro</span></h1>
              <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Laporan Finansial Komprehensif</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Periode Laporan</p>
              <p className="text-indigo-600 font-black text-xl">{reportData.periodeText}</p>
            </div>
          </div>

          {/* INSIGHT AI */}
          <div className="mb-8 p-6 rounded-2xl border-l-8 shadow-sm bg-slate-50" style={{ borderLeftColor: reportData.insightColor }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Kesimpulan Eksekutif</p>
            <p className="font-semibold text-xl leading-snug" style={{ color: reportData.insightColor }}>" {reportData.insightText} "</p>
          </div>

          {/* 4 METRIK UTAMA (Grid Baru) */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Pemasukan</p>
              <p className="text-xl font-black text-emerald-700">{formatRp(reportData.masuk)}</p>
            </div>
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
              <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-1">Pengeluaran</p>
              <p className="text-xl font-black text-rose-700">{formatRp(reportData.keluar)}</p>
            </div>
            <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100">
              <p className="text-sky-600 text-[10px] font-black uppercase tracking-widest mb-1">Investasi</p>
              <p className="text-xl font-black text-sky-700">{formatRp(reportData.invest)}</p>
            </div>
            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
              <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Sisa Bersih</p>
              <p className={`text-xl font-black ${reportData.netto >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>{formatRp(reportData.netto)}</p>
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
                      {/* Visual Bar Manual HTML */}
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
          <h3 className="text-sm font-black text-slate-800 mb-3 border-b-2 border-slate-800 pb-2 uppercase tracking-widest">Riwayat Transaksi Terbaru</h3>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-500">
                <th className="py-2 px-3 font-bold">Tanggal</th>
                <th className="py-2 px-3 font-bold">Kategori</th>
                <th className="py-2 px-3 font-bold">Deskripsi</th>
                <th className="py-2 px-3 font-bold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topTransaksi.map((t, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-3 px-3 text-slate-600">{t.date}</td>
                  <td className="py-3 px-3 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    {t.displayCat} <span className="text-[9px] text-slate-400 block mt-0.5">{t.displayType}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 italic">{t.desc}</td>
                  <td className="py-3 px-3 text-right font-black" style={{ color: t.color }}>
                    {t.displayType.includes('Pengeluaran') ? '-' : '+'}{formatRp(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-12 text-center text-slate-400 text-[10px] font-bold tracking-widest border-t border-slate-200 pt-6 uppercase">
            Dihasilkan secara otomatis oleh sistem DompetKu Pro &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  )
}