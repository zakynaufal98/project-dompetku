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
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('updateExportDate', handleExportDate)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('updateExportDate', handleExportDate)
    }
  }, [])

  const reportData = useMemo(() => {
    const now = new Date()
    const fallbackYear = String(now.getFullYear())
    const fallbackYM = `${fallbackYear}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const targetPeriod = exportDate || (isYearly ? fallbackYear : fallbackYM)
    const filterFn = (t) => t.date?.startsWith(targetPeriod)

    const expenses = txData.filter(t => t.type === 'out' && (t.cat !== 'Transfer' || t.sub_cat === 'Bayar Pinjaman') && filterFn(t))
    const incomes = txData.filter(t => t.type === 'in' && t.cat !== 'Transfer' && filterFn(t))
    const investments = invData.filter(t => t.action === 'beli' && filterFn(t))
    const masuk = incomes.reduce((s, t) => s + t.amount, 0)
    const keluar = expenses.reduce((s, t) => s + t.amount, 0)
    const invest = investments.reduce((s, t) => s + t.amount, 0)
    const netto = masuk - keluar
    const savingsRate = masuk > 0 ? (((Math.max(netto, 0) + invest) / masuk) * 100).toFixed(1) : '0.0'
    const totalGain = txData.filter(t => t.sub_cat === 'Profit Investasi' && filterFn(t)).reduce((s, t) => s + t.amount, 0)
    const totalLoss = txData.filter(t => t.sub_cat === 'Rugi Investasi' && filterFn(t)).reduce((s, t) => s + t.amount, 0)

    const catMap = {}
    expenses.forEach(t => { catMap[t.cat || 'Lainnya'] = (catMap[t.cat || 'Lainnya'] || 0) + t.amount })
    const allCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    const topCategories = allCategories.slice(0, 5)

    const inCatMap = {}
    incomes.forEach(t => { inCatMap[t.cat || 'Lainnya'] = (inCatMap[t.cat || 'Lainnya'] || 0) + t.amount })
    const incomeCategories = Object.entries(inCatMap).sort((a, b) => b[1] - a[1])

    const combinedTx = [
      ...txData.filter(t => t.cat !== 'Transfer' && filterFn(t)).map(t => ({
        ...t,
        displayType: t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
        displayCat: t.sub_cat ? `${t.cat || 'Lainnya'} - ${t.sub_cat}` : (t.cat || 'Lainnya'),
        color: t.type === 'in' ? '#059669' : '#DC2626',
        sign: t.type === 'in' ? '+' : '-',
      })),
      ...invData.filter(t => filterFn(t)).map(t => ({
        ...t,
        displayType: t.action === 'beli' ? 'Beli Aset' : 'Jual Aset',
        displayCat: `Investasi (${t.invType || 'Aset'})`,
        desc: t.desc || `${t.action === 'beli' ? 'Pembelian' : 'Penjualan'} ${t.subType || t.invType}`,
        color: t.action === 'beli' ? '#2563EB' : '#059669',
        sign: t.action === 'beli' ? '-' : '+',
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    const periodDate = isYearly ? null : new Date(`${targetPeriod}-01T00:00:00`)
    const periodeText = isYearly
      ? `Tahun ${targetPeriod}`
      : periodDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    let insight = `Arus kas sehat pada ${periodeText.toLowerCase()}.`
    let insightColor = '#059669'
    if (keluar > masuk) {
      insight = `Arus kas defisit sebesar Rp ${(keluar - masuk).toLocaleString('id-ID')}. Evaluasi pengeluaran terbesar.`
      insightColor = '#DC2626'
    } else if (masuk > 0 && keluar > masuk * 0.8) {
      insight = `Pengeluaran mencapai ${((keluar / masuk) * 100).toFixed(1)}% dari pemasukan. Ruang menabung masih bisa ditingkatkan.`
      insightColor = '#D97706'
    } else if (Number(savingsRate) >= 20) {
      insight = `Savings rate ${savingsRate}%. Alokasi tabungan dan investasi sudah berada di jalur baik.`
      insightColor = '#2563EB'
    }

    return {
      masuk, keluar, invest, netto, savingsRate, topCategories, allCategories, incomeCategories,
      totalGain, totalLoss, insightText: insight, insightColor,
      allTransaksi: combinedTx, periodeText,
      saldoSaatIni: totals?.saldo || 0, totalTx: combinedTx.length
    }
  }, [txData, invData, isYearly, totals, exportDate])

  const formatRp = (num = 0) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`
  const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const hexToRgb = (hex) => {
    const clean = String(hex || '#0F172A').replace('#', '')
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ]
  }
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
  const escapeXml = escapeHtml

  const handleExportExcel = () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')

    const summaryRows = [
      ['Saldo Saat Ini', formatRp(reportData.saldoSaatIni), '#4F46E5'],
      ['Pemasukan', `+ ${formatRp(reportData.masuk)}`, '#059669'],
      ['Pengeluaran', `- ${formatRp(reportData.keluar)}`, '#DC2626'],
      ['Arus Kas Bersih', formatRp(reportData.netto), reportData.netto >= 0 ? '#059669' : '#DC2626'],
      ['Investasi', formatRp(reportData.invest), '#2563EB'],
      ['Profit Investasi', `+ ${formatRp(reportData.totalGain)}`, '#059669'],
      ['Rugi Investasi', `- ${formatRp(reportData.totalLoss)}`, '#DC2626'],
      ['Savings Rate', `${reportData.savingsRate}%`, '#4F46E5'],
    ]

    const cell = (value, style = 'Text', type = 'String', merge = '') =>
      `<Cell${style ? ` ss:StyleID="${style}"` : ''}${merge ? ` ss:MergeAcross="${merge}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
    const numberCell = (value, style = 'Currency') =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(value || 0)}</Data></Cell>`
    const percentCell = (value) =>
      `<Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(value || 0) / 100}</Data></Cell>`
    const row = (cells, height = '') => `<Row${height ? ` ss:Height="${height}"` : ''}>${cells.join('')}</Row>`

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Arial" ss:Size="10"/></Style>
  <Style ss:ID="Title"><Font ss:FontName="Arial" ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#111827" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Meta"><Font ss:Color="#64748B"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Insight"><Font ss:Bold="1" ss:Color="${reportData.insightColor}"/><Interior ss:Color="#FFF7ED" ss:Pattern="Solid"/><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
  <Style ss:ID="Section"><Font ss:Bold="1" ss:Color="#0F172A"/><Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#334155"/><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
  <Style ss:ID="Text"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders><Alignment ss:WrapText="1" ss:Vertical="Center"/></Style>
  <Style ss:ID="TextBold"><Font ss:Bold="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Income"><Font ss:Bold="1" ss:Color="#059669"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Expense"><Font ss:Bold="1" ss:Color="#DC2626"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Blue"><Font ss:Bold="1" ss:Color="#2563EB"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Currency"><NumberFormat ss:Format="&quot;Rp&quot; #,##0;[Red]-&quot;Rp&quot; #,##0"/><Alignment ss:Horizontal="Right"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Percent"><NumberFormat ss:Format="0.0%"/><Alignment ss:Horizontal="Right"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
 </Styles>
 <Worksheet ss:Name="Ringkasan">
  <Table>
   <Column ss:Width="190"/><Column ss:Width="170"/><Column ss:Width="160"/><Column ss:Width="160"/>
   ${row([cell('DompetKu Pro - Laporan Keuangan', 'Title', 'String', 3)], 28)}
   ${row([cell(`Periode: ${reportData.periodeText}`, 'Meta', 'String', 1), cell(`Dibuat: ${new Date().toLocaleDateString('id-ID')}`, 'Meta', 'String', 1)])}
   ${row([cell(reportData.insightText, 'Insight', 'String', 3)], 36)}
   ${row([cell('', '', 'String')])}
   ${row([cell('Ringkasan', 'Section', 'String', 3)])}
   ${summaryRows.map(([label, value]) => {
      if (label === 'Savings Rate') return row([cell(label, 'TextBold'), percentCell(reportData.savingsRate)])
      const raw = {
        'Saldo Saat Ini': reportData.saldoSaatIni,
        'Pemasukan': reportData.masuk,
        'Pengeluaran': -reportData.keluar,
        'Arus Kas Bersih': reportData.netto,
        'Investasi': reportData.invest,
        'Profit Investasi': reportData.totalGain,
        'Rugi Investasi': -reportData.totalLoss,
      }[label]
      return row([cell(label, 'TextBold'), numberCell(raw), cell(value, raw >= 0 ? 'Income' : 'Expense')])
    }).join('')}
   ${row([cell('', '', 'String')])}
   ${row([cell('Top Pengeluaran', 'Section', 'String', 3)])}
   ${row([cell('Kategori', 'Header'), cell('Nominal', 'Header'), cell('Persentase', 'Header')])}
   ${reportData.topCategories.map(([cat, val], i) => row([
      cell(`${i + 1}. ${cat}`),
      numberCell(-val),
      percentCell(reportData.keluar > 0 ? (val / reportData.keluar) * 100 : 0),
    ])).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
 </Worksheet>
 <Worksheet ss:Name="Transaksi">
  <Table>
   <Column ss:Width="95"/><Column ss:Width="115"/><Column ss:Width="220"/><Column ss:Width="300"/><Column ss:Width="130"/>
   ${row([cell('Tanggal', 'Header'), cell('Tipe', 'Header'), cell('Kategori', 'Header'), cell('Deskripsi', 'Header'), cell('Nominal', 'Header')])}
   ${reportData.allTransaksi.map(t => {
      const nominal = t.sign === '-' ? -Number(t.amount || 0) : Number(t.amount || 0)
      const typeStyle = t.sign === '-' ? 'Expense' : (t.color === '#2563EB' ? 'Blue' : 'Income')
      return row([
        cell(formatDate(t.date)),
        cell(t.displayType, typeStyle),
        cell(t.displayCat),
        cell(t.desc),
        numberCell(nominal),
      ])
    }).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
 </Worksheet>
 <Worksheet ss:Name="Kategori">
  <Table>
   <Column ss:Width="230"/><Column ss:Width="140"/><Column ss:Width="120"/>
   ${row([cell('Kategori Pengeluaran', 'Header'), cell('Nominal', 'Header'), cell('Persentase', 'Header')])}
   ${reportData.allCategories.map(([cat, val]) => row([
      cell(cat),
      numberCell(-val),
      percentCell(reportData.keluar > 0 ? (val / reportData.keluar) * 100 : 0),
    ])).join('')}
   ${row([cell('', '', 'String')])}
   ${row([cell('Kategori Pemasukan', 'Header'), cell('Nominal', 'Header')])}
   ${reportData.incomeCategories.map(([cat, val]) => row([
      cell(cat),
      numberCell(val),
    ])).join('')}
  </Table>
 </Worksheet>
</Workbook>`

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `DompetKu_${isYearly ? 'Tahunan' : 'Bulanan'}_${reportData.periodeText.replace(/\s+/g, '_')}.xls`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleExportPDF = async () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')

    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth()
      const H = pdf.internal.pageSize.getHeight()
      const margin = 14
      let y = 16

      const addFooter = () => {
        pdf.setFontSize(7)
        pdf.setTextColor(148, 163, 184)
        pdf.text(`DompetKu Pro - dibuat ${new Date().toLocaleDateString('id-ID')}`, W / 2, H - 8, { align: 'center' })
      }

      const checkPage = (need) => {
        if (y + need <= H - 18) return
        addFooter()
        pdf.addPage()
        y = 16
      }

      const sectionTitle = (title, color = [17, 24, 39]) => {
        checkPage(14)
        pdf.setFillColor(...color)
        pdf.roundedRect(margin, y, W - margin * 2, 9, 2, 2, 'F')
        pdf.setFontSize(8)
        pdf.setTextColor(255)
        pdf.setFont(undefined, 'bold')
        pdf.text(title.toUpperCase(), margin + 5, y + 6)
        pdf.setFont(undefined, 'normal')
        y += 14
      }

      const drawMetric = (x, yPos, width, label, value, color) => {
        pdf.setFillColor(248, 250, 252)
        pdf.roundedRect(x, yPos, width, 24, 3, 3, 'F')
        pdf.setFontSize(6.5)
        pdf.setTextColor(...color)
        pdf.setFont(undefined, 'bold')
        pdf.text(label.toUpperCase(), x + 4, yPos + 7)
        pdf.setFontSize(10)
        pdf.setTextColor(15, 23, 42)
        pdf.text(value, x + 4, yPos + 17, { maxWidth: width - 8 })
        pdf.setFont(undefined, 'normal')
      }

      pdf.setFillColor(17, 24, 39)
      pdf.roundedRect(margin, y, W - margin * 2, 32, 4, 4, 'F')
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(20)
      pdf.setTextColor(255)
      pdf.text('DompetKu Pro', margin + 7, y + 13)
      pdf.setFontSize(9)
      pdf.setTextColor(203, 213, 225)
      pdf.text('Laporan Keuangan', margin + 7, y + 22)
      pdf.setFontSize(14)
      pdf.setTextColor(255)
      pdf.text(reportData.periodeText, W - margin - 7, y + 17, { align: 'right' })
      pdf.setFont(undefined, 'normal')
      y += 42

      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(margin, y, W - margin * 2, 22, 3, 3, 'F')
      pdf.setDrawColor(...hexToRgb(reportData.insightColor))
      pdf.setLineWidth(1.2)
      pdf.line(margin, y, margin, y + 22)
      pdf.setFontSize(7)
      pdf.setTextColor(100, 116, 139)
      pdf.text('INSIGHT', margin + 5, y + 7)
      pdf.setFontSize(9)
      pdf.setTextColor(15, 23, 42)
      pdf.text(pdf.splitTextToSize(reportData.insightText, W - margin * 2 - 14), margin + 5, y + 14)
      y += 31

      const cardW = (W - margin * 2 - 8) / 3
      const metrics = [
        ['Saldo Saat Ini', formatRp(reportData.saldoSaatIni), [79, 70, 229]],
        ['Pemasukan', `+ ${formatRp(reportData.masuk)}`, [5, 150, 105]],
        ['Pengeluaran', `- ${formatRp(reportData.keluar)}`, [220, 38, 38]],
        ['Arus Kas Bersih', formatRp(reportData.netto), reportData.netto >= 0 ? [5, 150, 105] : [220, 38, 38]],
        ['Investasi', formatRp(reportData.invest), [37, 99, 235]],
        ['Savings Rate', `${reportData.savingsRate}%`, [79, 70, 229]],
      ]
      metrics.forEach((m, i) => drawMetric(margin + (i % 3) * (cardW + 4), y + Math.floor(i / 3) * 29, cardW, m[0], m[1], m[2]))
      y += 63

      sectionTitle('Distribusi Pengeluaran', [30, 41, 59])
      if (reportData.allCategories.length === 0) {
        pdf.setFontSize(9)
        pdf.setTextColor(100, 116, 139)
        pdf.text('Tidak ada pengeluaran pada periode ini.', margin, y)
        y += 8
      } else {
        reportData.allCategories.forEach(([cat, val], i) => {
          checkPage(10)
          const pct = reportData.keluar > 0 ? (val / reportData.keluar) * 100 : 0
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(margin, y - 3, W - margin * 2, 8, 'F')
          }
          pdf.setFontSize(8)
          pdf.setTextColor(51, 65, 85)
          pdf.text(String(cat), margin + 2, y + 2, { maxWidth: 72 })
          pdf.setTextColor(220, 38, 38)
          pdf.setFont(undefined, 'bold')
          pdf.text(formatRp(val), W - margin - 40, y + 2, { align: 'right' })
          pdf.setFont(undefined, 'normal')
          pdf.setTextColor(100, 116, 139)
          pdf.text(`${pct.toFixed(1)}%`, W - margin - 2, y + 2, { align: 'right' })
          y += 8
        })
      }

      if (reportData.incomeCategories.length > 0) {
        sectionTitle('Sumber Pemasukan', [5, 150, 105])
        reportData.incomeCategories.forEach(([cat, val], i) => {
          checkPage(8)
          if (i % 2 === 0) {
            pdf.setFillColor(248, 250, 252)
            pdf.rect(margin, y - 3, W - margin * 2, 8, 'F')
          }
          pdf.setFontSize(8)
          pdf.setTextColor(51, 65, 85)
          pdf.text(String(cat), margin + 2, y + 2)
          pdf.setTextColor(5, 150, 105)
          pdf.setFont(undefined, 'bold')
          pdf.text(formatRp(val), W - margin - 2, y + 2, { align: 'right' })
          pdf.setFont(undefined, 'normal')
          y += 8
        })
      }

      sectionTitle(`Riwayat Transaksi (${reportData.totalTx})`, [17, 24, 39])
      pdf.setFillColor(241, 245, 249)
      pdf.rect(margin, y, W - margin * 2, 8, 'F')
      pdf.setFontSize(7)
      pdf.setTextColor(71, 85, 105)
      pdf.setFont(undefined, 'bold')
      pdf.text('Tanggal', margin + 2, y + 5)
      pdf.text('Tipe', margin + 28, y + 5)
      pdf.text('Kategori', margin + 57, y + 5)
      pdf.text('Deskripsi', margin + 104, y + 5)
      pdf.text('Nominal', W - margin - 2, y + 5, { align: 'right' })
      pdf.setFont(undefined, 'normal')
      y += 10

      reportData.allTransaksi.forEach((t, i) => {
        checkPage(9)
        if (i % 2 === 0) {
          pdf.setFillColor(252, 252, 253)
          pdf.rect(margin, y - 3, W - margin * 2, 8, 'F')
        }
        pdf.setFontSize(7)
        pdf.setTextColor(100, 116, 139)
        pdf.text(formatDate(t.date), margin + 2, y + 2)
        pdf.setTextColor(...hexToRgb(t.color))
        pdf.setFont(undefined, 'bold')
        pdf.text(String(t.displayType).slice(0, 13), margin + 28, y + 2)
        pdf.setFont(undefined, 'normal')
        pdf.setTextColor(51, 65, 85)
        pdf.text(String(t.displayCat || '').slice(0, 24), margin + 57, y + 2)
        pdf.setTextColor(100, 116, 139)
        pdf.text(String(t.desc || '').slice(0, 28), margin + 104, y + 2)
        pdf.setTextColor(...hexToRgb(t.color))
        pdf.setFont(undefined, 'bold')
        pdf.text(`${t.sign} ${formatRp(t.amount)}`, W - margin - 2, y + 2, { align: 'right' })
        pdf.setFont(undefined, 'normal')
        y += 8
      })

      addFooter()
      pdf.save(`DompetKu_${isYearly ? 'Tahunan' : 'Bulanan'}_${reportData.periodeText.replace(/\s+/g, '_')}.pdf`)
    } catch (error) {
      console.error(error)
      alert('Gagal mengekspor PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        <span>{isExporting ? 'Memproses...' : `Export Laporan ${isYearly ? 'Tahunan' : 'Bulanan'}`}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in" role="menu">
          <button onClick={handleExportPDF} className="w-full text-left px-4 py-3.5 text-sm font-semibold text-text hover:bg-bg hover:text-income flex items-center gap-3 transition-colors border-b border-border group" role="menuitem">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={18} /></div>
            <div><p>PDF Executive</p><p className="text-[10px] text-muted2 font-normal">Ringkas, bersih, multi-halaman</p></div>
          </button>
          <button onClick={handleExportExcel} className="w-full text-left px-4 py-3.5 text-sm font-semibold text-text hover:bg-bg hover:text-income flex items-center gap-3 transition-colors group" role="menuitem">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><FileSpreadsheet size={18} /></div>
            <div><p>Excel Analitik</p><p className="text-[10px] text-muted2 font-normal">Tabel bersih siap dibaca</p></div>
          </button>
        </div>
      )}
    </div>
  )
}
