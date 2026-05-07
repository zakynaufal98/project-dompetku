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
        displayCat: t.sub_cat ? `${t.cat || 'Lainnya'} › ${t.sub_cat}` : (t.cat || 'Lainnya'),
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
    let insightBg = [240, 253, 244]
    if (keluar > masuk) {
      insight = `Arus kas defisit sebesar Rp ${(keluar - masuk).toLocaleString('id-ID')}. Evaluasi pengeluaran terbesar.`
      insightColor = '#DC2626'; insightBg = [254, 242, 242]
    } else if (masuk > 0 && keluar > masuk * 0.8) {
      insight = `Pengeluaran mencapai ${((keluar / masuk) * 100).toFixed(1)}% dari pemasukan. Ruang menabung masih bisa ditingkatkan.`
      insightColor = '#D97706'; insightBg = [255, 251, 235]
    } else if (Number(savingsRate) >= 20) {
      insight = `Savings rate ${savingsRate}%. Alokasi tabungan dan investasi sudah berada di jalur yang sangat baik.`
      insightColor = '#2563EB'; insightBg = [239, 246, 255]
    }

    return {
      masuk, keluar, invest, netto, savingsRate, topCategories, allCategories, incomeCategories,
      totalGain, totalLoss, insightText: insight, insightColor, insightBg,
      allTransaksi: combinedTx, periodeText,
      saldoSaatIni: totals?.saldo || 0, totalTx: combinedTx.length
    }
  }, [txData, invData, isYearly, totals, exportDate])

  const formatRp = (num = 0) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`
  const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  const hexToRgb = (hex) => {
    const clean = String(hex || '#0F172A').replace('#', '')
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
  }

  const escapeXml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')

  // ─────────────────────────────────────────────────────────────────────────
  // EXCEL EXPORT — Office XML dengan palette DompetKu Pro
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')

    const cell = (value, style = 'Text', type = 'String', merge = '') =>
      `<Cell${style ? ` ss:StyleID="${style}"` : ''}${merge ? ` ss:MergeAcross="${merge}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`
    const numCell = (value, style = 'Currency') =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(value || 0)}</Data></Cell>`
    const pctCell = (value) =>
      `<Cell ss:StyleID="Percent"><Data ss:Type="Number">${Number(value || 0) / 100}</Data></Cell>`
    const row = (cells, height = '') =>
      `<Row${height ? ` ss:Height="${height}"` : ''}>${cells.join('')}</Row>`

    const summaryRows = [
      { label: 'Saldo Saat Ini',   val: reportData.saldoSaatIni,  style: 'StyleIndigo' },
      { label: 'Total Pemasukan',  val: reportData.masuk,          style: 'StyleGreen'  },
      { label: 'Total Pengeluaran',val: -reportData.keluar,        style: 'StyleRed'    },
      { label: 'Arus Kas Bersih',  val: reportData.netto,          style: reportData.netto >= 0 ? 'StyleGreen' : 'StyleRed' },
      { label: 'Total Investasi',  val: reportData.invest,         style: 'StyleBlue'   },
      { label: 'Profit Investasi', val: reportData.totalGain,      style: 'StyleGreen'  },
      { label: 'Rugi Investasi',   val: -reportData.totalLoss,     style: 'StyleRed'    },
      { label: 'Savings Rate',     val: null,                      style: 'StyleIndigo', pct: true },
    ]

    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0F172A"/><Alignment ss:Vertical="Center"/></Style>

  <!-- HEADER STYLES -->
  <Style ss:ID="Title">
    <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#94A3B8"/>
    <Interior ss:Color="#1E1B4B" ss:Pattern="Solid"/>
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="InsightCell">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="${reportData.insightColor}"/>
    <Interior ss:Color="${reportData.insightColor === '#059669' ? '#F0FDF4' : reportData.insightColor === '#DC2626' ? '#FEF2F2' : reportData.insightColor === '#D97706' ? '#FFFBEB' : '#EFF6FF'}" ss:Pattern="Solid"/>
    <Alignment ss:WrapText="1" ss:Vertical="Center"/>
    <Borders><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="3" ss:Color="${reportData.insightColor}"/></Borders>
  </Style>

  <!-- SECTION HEADERS -->
  <Style ss:ID="SecIndigo">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SecTeal">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#0D9488" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SecRed">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#B91C1C" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SecDark">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#111827" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center"/>
  </Style>

  <!-- COLUMN HEADERS -->
  <Style ss:ID="ColHeader">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#334155"/>
    <Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#4F46E5"/>
    </Borders>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ColHeaderTeal">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#134E4A"/>
    <Interior ss:Color="#CCFBF1" ss:Pattern="Solid"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0D9488"/>
    </Borders>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ColHeaderRed">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#7F1D1D"/>
    <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
    <Borders>
      <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#B91C1C"/>
    </Borders>
    <Alignment ss:Vertical="Center"/>
  </Style>

  <!-- DATA STYLES -->
  <Style ss:ID="Text">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#334155"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:WrapText="1" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TextBold">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TextAlt">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#334155"/>
    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:WrapText="1" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TextAltBold">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#0F172A"/>
    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Vertical="Center"/>
  </Style>

  <!-- VALUE STYLES -->
  <Style ss:ID="StyleIndigo">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#4F46E5"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="StyleGreen">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#059669"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="StyleRed">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#DC2626"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="StyleBlue">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#2563EB"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>

  <!-- NUMBER FORMATS -->
  <Style ss:ID="Currency">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#0F172A"/>
    <NumberFormat ss:Format="&quot;Rp &quot;#,##0;[Red]-&quot;Rp &quot;#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="CurrencyAlt">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#0F172A"/>
    <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="&quot;Rp &quot;#,##0;[Red]-&quot;Rp &quot;#,##0"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="Percent">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#4F46E5" ss:Bold="1"/>
    <NumberFormat ss:Format="0.0%"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>
  <Style ss:ID="PercentMuted">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#64748B"/>
    <NumberFormat ss:Format="0.0%"/>
    <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders>
  </Style>

  <Style ss:ID="Empty"><Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/></Style>
 </Styles>

 <!-- ════════════ SHEET 1: RINGKASAN ════════════ -->
 <Worksheet ss:Name="Ringkasan">
  <Table>
   <Column ss:Width="200"/><Column ss:Width="160"/><Column ss:Width="130"/><Column ss:Width="130"/>

   ${row([cell('DompetKu Pro — Laporan Keuangan', 'Title', 'String', 3)], 32)}
   ${row([cell(`Periode: ${reportData.periodeText}`, 'SubTitle', 'String', 1), cell(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 'SubTitle', 'String', 1)], 18)}
   ${row([cell('', 'Empty', 'String', 3)], 8)}
   ${row([cell(`💡  ${reportData.insightText}`, 'InsightCell', 'String', 3)], 36)}
   ${row([cell('', 'Empty', 'String', 3)], 8)}

   ${row([cell('RINGKASAN KEUANGAN', 'SecIndigo', 'String', 3)], 22)}
   ${row([cell('Metrik', 'ColHeader'), cell('Nilai (Rp)', 'ColHeader'), cell('Keterangan', 'ColHeader'), cell('', 'ColHeader')])}
   ${summaryRows.map((s, i) => {
     const isAlt = i % 2 === 1
     const baseText = isAlt ? 'TextAltBold' : 'TextBold'
     const baseCurr = isAlt ? 'CurrencyAlt' : 'Currency'
     if (s.pct) return row([cell(s.label, baseText), pctCell(reportData.savingsRate), cell('Persentase tabungan dari pemasukan', isAlt ? 'TextAlt' : 'Text'), cell('', isAlt ? 'TextAlt' : 'Text')])
     return row([cell(s.label, baseText), numCell(s.val, baseCurr), cell(formatRp(Math.abs(s.val)), s.style), cell('', isAlt ? 'TextAlt' : 'Text')])
   }).join('')}

   ${row([cell('', 'Empty', 'String', 3)], 8)}
   ${row([cell('TOP PENGELUARAN', 'SecRed', 'String', 3)], 22)}
   ${row([cell('Kategori', 'ColHeaderRed'), cell('Nominal', 'ColHeaderRed'), cell('Persentase', 'ColHeaderRed'), cell('', 'ColHeaderRed')])}
   ${reportData.topCategories.map(([cat, val], i) => {
     const isAlt = i % 2 === 1
     return row([
       cell(`${i + 1}.  ${cat}`, isAlt ? 'TextAlt' : 'Text'),
       numCell(-val, isAlt ? 'CurrencyAlt' : 'Currency'),
       pctCell(reportData.keluar > 0 ? (val / reportData.keluar) * 100 : 0),
       cell('', isAlt ? 'TextAlt' : 'Text'),
     ])
   }).join('')}

   ${reportData.incomeCategories.length > 0 ? `
   ${row([cell('', 'Empty', 'String', 3)], 8)}
   ${row([cell('SUMBER PEMASUKAN', 'SecTeal', 'String', 3)], 22)}
   ${row([cell('Sumber', 'ColHeaderTeal'), cell('Nominal', 'ColHeaderTeal'), cell('Persentase', 'ColHeaderTeal'), cell('', 'ColHeaderTeal')])}
   ${reportData.incomeCategories.map(([cat, val], i) => {
     const isAlt = i % 2 === 1
     return row([
       cell(cat, isAlt ? 'TextAlt' : 'Text'),
       numCell(val, isAlt ? 'CurrencyAlt' : 'Currency'),
       pctCell(reportData.masuk > 0 ? (val / reportData.masuk) * 100 : 0),
       cell('', isAlt ? 'TextAlt' : 'Text'),
     ])
   }).join('')}` : ''}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>

 <!-- ════════════ SHEET 2: TRANSAKSI ════════════ -->
 <Worksheet ss:Name="Transaksi">
  <Table>
   <Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="200"/><Column ss:Width="260"/><Column ss:Width="130"/>
   ${row([cell('RIWAYAT TRANSAKSI', 'SecDark', 'String', 4)], 22)}
   ${row([cell(`Periode: ${reportData.periodeText}  •  Total: ${reportData.totalTx} transaksi`, 'SubTitle', 'String', 4)], 18)}
   ${row([cell('', 'Empty', 'String', 4)], 6)}
   ${row([cell('Tanggal', 'ColHeader'), cell('Tipe', 'ColHeader'), cell('Kategori', 'ColHeader'), cell('Keterangan', 'ColHeader'), cell('Nominal', 'ColHeader')])}
   ${reportData.allTransaksi.map((t, i) => {
     const isAlt = i % 2 === 1
     const nominal = t.sign === '-' ? -Number(t.amount || 0) : Number(t.amount || 0)
     const typeStyle = t.sign === '+' ? (t.color === '#2563EB' ? 'StyleBlue' : 'StyleGreen') : 'StyleRed'
     return row([
       cell(formatDate(t.date), isAlt ? 'TextAlt' : 'Text'),
       cell(t.displayType, typeStyle),
       cell(t.displayCat, isAlt ? 'TextAlt' : 'Text'),
       cell(t.desc, isAlt ? 'TextAlt' : 'Text'),
       numCell(nominal, isAlt ? 'CurrencyAlt' : 'Currency'),
     ])
   }).join('')}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>

 <!-- ════════════ SHEET 3: KATEGORI ════════════ -->
 <Worksheet ss:Name="Kategori">
  <Table>
   <Column ss:Width="230"/><Column ss:Width="140"/><Column ss:Width="120"/>

   ${row([cell('DISTRIBUSI PENGELUARAN', 'SecRed', 'String', 2)], 22)}
   ${row([cell('Kategori', 'ColHeaderRed'), cell('Nominal', 'ColHeaderRed'), cell('Porsi', 'ColHeaderRed')])}
   ${reportData.allCategories.map(([cat, val], i) => {
     const isAlt = i % 2 === 1
     return row([
       cell(cat, isAlt ? 'TextAlt' : 'Text'),
       numCell(-val, isAlt ? 'CurrencyAlt' : 'Currency'),
       pctCell(reportData.keluar > 0 ? (val / reportData.keluar) * 100 : 0),
     ])
   }).join('')}

   ${row([cell('', 'Empty', 'String', 2)], 10)}

   ${row([cell('DISTRIBUSI PEMASUKAN', 'SecTeal', 'String', 2)], 22)}
   ${row([cell('Sumber', 'ColHeaderTeal'), cell('Nominal', 'ColHeaderTeal'), cell('Porsi', 'ColHeaderTeal')])}
   ${reportData.incomeCategories.map(([cat, val], i) => {
     const isAlt = i % 2 === 1
     return row([
       cell(cat, isAlt ? 'TextAlt' : 'Text'),
       numCell(val, isAlt ? 'CurrencyAlt' : 'Currency'),
       pctCell(reportData.masuk > 0 ? (val / reportData.masuk) * 100 : 0),
     ])
   }).join('')}
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

  // ─────────────────────────────────────────────────────────────────────────
  // PDF EXPORT — Desain premium bertema DompetKu Pro
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    setIsOpen(false)
    if (!reportData.allTransaksi.length) return alert('Belum ada data pada periode ini.')

    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const W = pdf.internal.pageSize.getWidth()
      const H = pdf.internal.pageSize.getHeight()
      const M = 14              // margin
      const CW = W - M * 2     // content width
      let y = M
      let pageNum = 1

      // ── Palet warna
      const C = {
        dark:    [15, 23, 42],
        navy:    [17, 24, 39],
        indigo:  [79, 70, 229],
        indigoL: [99, 102, 241],
        teal:    [13, 148, 136],
        red:     [185, 28, 28],
        redL:    [220, 38, 38],
        green:   [5, 150, 105],
        blue:    [37, 99, 235],
        amber:   [217, 119, 6],
        slate:   [71, 85, 105],
        muted:   [100, 116, 139],
        light:   [248, 250, 252],
        lighter: [241, 245, 249],
        white:   [255, 255, 255],
        border:  [226, 232, 240],
        iPale:   [238, 242, 255],
        gPale:   [240, 253, 244],
        rPale:   [254, 242, 242],
        bPale:   [239, 246, 255],
      }

      // ── Helpers
      const setFont = (size, weight = 'normal', color = C.dark) => {
        pdf.setFont(undefined, weight)
        pdf.setFontSize(size)
        pdf.setTextColor(...color)
      }

      const addFooter = () => {
        pdf.setDrawColor(...C.border)
        pdf.setLineWidth(0.25)
        pdf.line(M, H - 11, W - M, H - 11)
        setFont(6.5, 'normal', C.muted)
        pdf.text('DompetKu Pro  —  Laporan Keuangan Pribadi', M, H - 6)
        pdf.text(
          `Halaman ${pageNum}  •  Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          W - M, H - 6, { align: 'right' }
        )
      }

      const checkPage = (need) => {
        if (y + need <= H - 16) return
        addFooter()
        pdf.addPage()
        pageNum++
        y = M
      }

      // ── Section header dengan left accent bar
      const sectionHeader = (title, accentRgb = C.indigo, badgeText = '') => {
        checkPage(14)
        pdf.setFillColor(...C.navy)
        pdf.roundedRect(M, y, CW, 11, 2, 2, 'F')
        pdf.setDrawColor(...accentRgb)
        pdf.setLineWidth(3)
        pdf.line(M + 1.5, y + 1.5, M + 1.5, y + 9.5)
        pdf.setLineWidth(0.25)
        setFont(8, 'bold', C.white)
        pdf.text(title, M + 8, y + 7.5)
        if (badgeText) {
          const bw = pdf.getTextWidth(badgeText) + 8
          pdf.setFillColor(...accentRgb)
          pdf.roundedRect(W - M - bw - 2, y + 2, bw, 7, 2, 2, 'F')
          setFont(6.5, 'bold', C.white)
          pdf.text(badgeText, W - M - 4, y + 7, { align: 'right' })
        }
        y += 15
      }

      // ── Column header bar
      const colHeaders = (cols) => {
        pdf.setFillColor(...C.lighter)
        pdf.roundedRect(M, y, CW, 8, 1, 1, 'F')
        pdf.setDrawColor(...C.border)
        pdf.setLineWidth(0.2)
        pdf.line(M, y + 8, M + CW, y + 8)
        setFont(6.5, 'bold', C.slate)
        cols.forEach(({ label, x, align }) => {
          pdf.text(label, x, y + 5.5, { align: align || 'left' })
        })
        y += 10
      }

      // ── Data row
      const dataRow = (cells, rowIdx) => {
        checkPage(9.5)
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(252, 252, 253)
          pdf.rect(M, y - 1.5, CW, 9.5, 'F')
        }
        cells.forEach(({ text, x, color, bold, align, maxW }) => {
          setFont(7, bold ? 'bold' : 'normal', color || C.slate)
          pdf.text(String(text || ''), x, y + 4.5, { align: align || 'left', maxWidth: maxW })
        })
        y += 9.5
      }

      // ────────────────────────────────────────────────
      // 1. HEADER UTAMA
      // ────────────────────────────────────────────────
      // Background block
      pdf.setFillColor(...C.navy)
      pdf.roundedRect(M, y, CW, 48, 4, 4, 'F')

      // Left accent strip (indigo)
      pdf.setFillColor(...C.indigo)
      pdf.rect(M, y + 4, 5, 40, 'F')
      pdf.setFillColor(...C.indigo)
      pdf.roundedRect(M, y + 4, 7, 7, 3.5, 3.5, 'F')
      pdf.roundedRect(M, y + 37, 7, 7, 3.5, 3.5, 'F')

      // Logo circle (D)
      pdf.setFillColor(...C.indigo)
      pdf.circle(M + 16, y + 14, 6.5, 'F')
      setFont(10, 'bold', C.white)
      pdf.text('D', M + 16, y + 17, { align: 'center' })

      // App name & subtitle
      setFont(18, 'bold', C.white)
      pdf.text('DompetKu Pro', M + 26, y + 17)
      setFont(8, 'normal', [148, 163, 184])
      pdf.text('Laporan Keuangan Pribadi', M + 26, y + 26)

      // Period badge (right)
      const pw = pdf.getTextWidth(reportData.periodeText) + 14
      pdf.setFillColor(...C.indigoL)
      pdf.roundedRect(W - M - pw - 2, y + 12, pw + 2, 12, 3, 3, 'F')
      setFont(8.5, 'bold', C.white)
      pdf.text(reportData.periodeText, W - M - 5, y + 20, { align: 'right' })

      // Bottom meta
      setFont(7, 'normal', [100, 116, 139])
      const now2 = new Date()
      pdf.text(
        `Dibuat: ${now2.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
        M + 26, y + 39
      )

      y += 58

      // ────────────────────────────────────────────────
      // 2. INSIGHT BOX
      // ────────────────────────────────────────────────
      const insRgb = hexToRgb(reportData.insightColor)
      const insBg = reportData.insightBg
      pdf.setFillColor(...insBg)
      pdf.roundedRect(M, y, CW, 26, 3, 3, 'F')
      pdf.setDrawColor(...insRgb)
      pdf.setLineWidth(3)
      pdf.line(M + 1.5, y + 2, M + 1.5, y + 24)
      pdf.setLineWidth(0.25)
      setFont(6, 'bold', insRgb)
      pdf.text('INSIGHT KEUANGAN', M + 8, y + 8)
      setFont(8.5, 'normal', C.dark)
      const insLines = pdf.splitTextToSize(reportData.insightText, CW - 14)
      pdf.text(insLines, M + 8, y + 16)
      y += 34

      // ────────────────────────────────────────────────
      // 3. METRIC CARDS (2 baris x 3 kolom)
      // ────────────────────────────────────────────────
      const cardW = (CW - 8) / 3
      const cardH = 28

      const metrics = [
        { label: 'SALDO TOTAL',    value: formatRp(reportData.saldoSaatIni), color: C.indigo, bg: C.iPale },
        { label: 'PEMASUKAN',      value: `+ ${formatRp(reportData.masuk)}`, color: C.green,  bg: C.gPale },
        { label: 'PENGELUARAN',    value: `- ${formatRp(reportData.keluar)}`, color: C.red,   bg: C.rPale },
        { label: 'ARUS KAS BERSIH',value: formatRp(reportData.netto),        color: reportData.netto >= 0 ? C.green : C.red, bg: reportData.netto >= 0 ? C.gPale : C.rPale },
        { label: 'INVESTASI',      value: formatRp(reportData.invest),       color: C.blue,   bg: C.bPale },
        { label: 'SAVINGS RATE',   value: `${reportData.savingsRate}%`,      color: C.indigo, bg: C.iPale },
      ]

      metrics.forEach((m, i) => {
        const col = i % 3
        const rw = Math.floor(i / 3)
        const cx = M + col * (cardW + 4)
        const cy = y + rw * (cardH + 4)
        pdf.setFillColor(...m.bg)
        pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'F')
        pdf.setFillColor(...m.color)
        pdf.roundedRect(cx, cy, cardW, 2.5, 1.5, 1.5, 'F')
        setFont(5.5, 'bold', m.color)
        pdf.text(m.label, cx + 5, cy + 10)
        setFont(9.5, 'bold', C.dark)
        pdf.text(m.value, cx + 5, cy + 22, { maxWidth: cardW - 8 })
      })
      y += cardH * 2 + 4 + 12

      // ────────────────────────────────────────────────
      // 4. DISTRIBUSI PENGELUARAN
      // ────────────────────────────────────────────────
      if (reportData.allCategories.length > 0) {
        checkPage(18)
        sectionHeader('DISTRIBUSI PENGELUARAN', C.red, `${reportData.allCategories.length} kategori`)
        colHeaders([
          { label: 'Kategori',   x: M + 3 },
          { label: 'Grafik',     x: M + 88 },
          { label: 'Porsi',      x: M + 128 },
          { label: 'Nominal',    x: W - M - 3, align: 'right' },
        ])

        reportData.allCategories.forEach(([cat, val], i) => {
          checkPage(10)
          const pct = reportData.keluar > 0 ? (val / reportData.keluar) : 0
          const barMaxW = 36
          const barFill = pct * barMaxW

          if (i % 2 === 0) {
            pdf.setFillColor(252, 252, 253)
            pdf.rect(M, y - 1.5, CW, 9.5, 'F')
          }

          setFont(7.5, 'normal', C.slate)
          pdf.text(String(cat).slice(0, 24), M + 3, y + 4.5)

          // Bar track
          pdf.setFillColor(226, 232, 240)
          pdf.roundedRect(M + 86, y + 1.5, barMaxW, 5, 1, 1, 'F')
          // Bar fill
          if (barFill > 0.5) {
            pdf.setFillColor(...C.red)
            pdf.roundedRect(M + 86, y + 1.5, barFill, 5, 1, 1, 'F')
          }

          setFont(7, 'bold', C.muted)
          pdf.text(`${(pct * 100).toFixed(1)}%`, M + 126, y + 4.5)
          setFont(7, 'bold', C.redL)
          pdf.text(formatRp(val), W - M - 3, y + 4.5, { align: 'right' })
          y += 9.5
        })
        y += 4
      }

      // ────────────────────────────────────────────────
      // 5. SUMBER PEMASUKAN
      // ────────────────────────────────────────────────
      if (reportData.incomeCategories.length > 0) {
        checkPage(18)
        sectionHeader('SUMBER PEMASUKAN', C.teal, `${reportData.incomeCategories.length} sumber`)
        colHeaders([
          { label: 'Sumber',   x: M + 3 },
          { label: 'Grafik',   x: M + 88 },
          { label: 'Porsi',    x: M + 128 },
          { label: 'Nominal',  x: W - M - 3, align: 'right' },
        ])

        reportData.incomeCategories.forEach(([cat, val], i) => {
          checkPage(10)
          const pct = reportData.masuk > 0 ? (val / reportData.masuk) : 0
          const barMaxW = 36
          const barFill = pct * barMaxW

          if (i % 2 === 0) {
            pdf.setFillColor(252, 252, 253)
            pdf.rect(M, y - 1.5, CW, 9.5, 'F')
          }

          setFont(7.5, 'normal', C.slate)
          pdf.text(String(cat).slice(0, 24), M + 3, y + 4.5)

          pdf.setFillColor(226, 232, 240)
          pdf.roundedRect(M + 86, y + 1.5, barMaxW, 5, 1, 1, 'F')
          if (barFill > 0.5) {
            pdf.setFillColor(...C.teal)
            pdf.roundedRect(M + 86, y + 1.5, barFill, 5, 1, 1, 'F')
          }

          setFont(7, 'bold', C.muted)
          pdf.text(`${(pct * 100).toFixed(1)}%`, M + 126, y + 4.5)
          setFont(7, 'bold', C.green)
          pdf.text(formatRp(val), W - M - 3, y + 4.5, { align: 'right' })
          y += 9.5
        })
        y += 4
      }

      // ────────────────────────────────────────────────
      // 6. RIWAYAT TRANSAKSI
      // ────────────────────────────────────────────────
      checkPage(20)
      sectionHeader(`RIWAYAT TRANSAKSI`, C.indigoL, `${reportData.totalTx} data`)
      colHeaders([
        { label: 'Tanggal',    x: M + 3 },
        { label: 'Tipe',       x: M + 30 },
        { label: 'Kategori',   x: M + 62 },
        { label: 'Keterangan', x: M + 108 },
        { label: 'Nominal',    x: W - M - 3, align: 'right' },
      ])

      reportData.allTransaksi.forEach((t, i) => {
        checkPage(10)
        const tColor = hexToRgb(t.color)

        // Type badge bg
        const bgR = Math.round(tColor[0] + (255 - tColor[0]) * 0.88)
        const bgG = Math.round(tColor[1] + (255 - tColor[1]) * 0.88)
        const bgB = Math.round(tColor[2] + (255 - tColor[2]) * 0.88)

        if (i % 2 === 0) {
          pdf.setFillColor(252, 252, 253)
          pdf.rect(M, y - 1.5, CW, 9.5, 'F')
        }

        setFont(7, 'normal', C.muted)
        pdf.text(formatDate(t.date), M + 3, y + 4.5)

        // Colored type pill
        pdf.setFillColor(bgR, bgG, bgB)
        pdf.roundedRect(M + 28, y + 0.5, 30, 7, 1.5, 1.5, 'F')
        setFont(6.5, 'bold', tColor)
        pdf.text(String(t.displayType).slice(0, 12), M + 30, y + 5)

        setFont(7, 'normal', C.slate)
        pdf.text(String(t.displayCat || '').slice(0, 22), M + 62, y + 4.5)
        setFont(7, 'normal', C.muted)
        pdf.text(String(t.desc || '').slice(0, 26), M + 108, y + 4.5)
        setFont(7, 'bold', tColor)
        pdf.text(`${t.sign}${formatRp(t.amount)}`, W - M - 3, y + 4.5, { align: 'right' })

        y += 9.5
      })

      addFooter()
      pdf.save(`DompetKu_${isYearly ? 'Tahunan' : 'Bulanan'}_${reportData.periodeText.replace(/\s+/g, '_')}.pdf`)
    } catch (error) {
      console.error(error)
      alert('Gagal mengekspor PDF. Coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
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
        <span>{isExporting ? 'Memproses...' : `Export ${isYearly ? 'Tahunan' : 'Bulanan'}`}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-68 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in"
          role="menu"
          style={{ width: 272 }}
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest">Pilih Format</p>
            <p className="text-xs text-muted mt-0.5">{reportData.periodeText}</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-4 py-3.5 hover:bg-bg flex items-center gap-3 transition-colors border-b border-border group"
            role="menuitem"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text">PDF Executive</p>
              <p className="text-[10px] text-muted mt-0.5">Laporan formal siap cetak & arsip</p>
            </div>
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full text-left px-4 py-3.5 hover:bg-bg flex items-center gap-3 transition-colors group"
            role="menuitem"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #065f46)' }}>
              <FileSpreadsheet size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text">Excel Analitik</p>
              <p className="text-[10px] text-muted mt-0.5">3 sheet: Ringkasan, Transaksi, Kategori</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
