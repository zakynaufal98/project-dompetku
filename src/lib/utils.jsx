import {
  Receipt,
  Home,
  Utensils,
  Car,
  Pill,
  Shirt,
  BookOpen,
  Sparkles,
  Banknote,
  BarChart3,
  TrendingUp,
  Coins,
  Wallet,
  CreditCard,
  Briefcase,
  Laptop
} from 'lucide-react'
import { EMOJI_RULES } from './emojiRules'

// Fungsi untuk format Rupiah penuh
export const fmt = (n) => {
  if (!n) return 'Rp\u00A00'; 
  const isNegative = n < 0; 
  const formatted = Math.abs(n).toLocaleString('id-ID'); 
  return (isNegative ? '-' : '') + 'Rp\u00A0' + formatted;
}

// Format singkatan untuk kartu & label agar muat di mobile (Rp 1,5 Jt / Rp 2,3 M)
export const fmtShort = (n) => {
  if (!n) return 'Rp\u00A00'
  const isNegative = n < 0
  const a = Math.abs(n)

  let val = ''
  if (a >= 1e9) {
    val = parseFloat((a / 1e9).toFixed(2)).toString().replace('.', ',') + ' M'
  } else if (a >= 1e6) {
    val = parseFloat((a / 1e6).toFixed(2)).toString().replace('.', ',') + ' Jt'
  } else if (a >= 1e3) {
    // Ratusan ribu tetap disingkat agar muat di kartu mobile
    val = parseFloat((a / 1e3).toFixed(1)).toString().replace('.', ',') + ' rb'
  } else {
    val = a.toLocaleString('id-ID')
  }

  return (isNegative ? '-' : '') + 'Rp\u00A0' + val
}

// Khusus untuk label sumbu Y pada grafik agar tidak terpotong
export const fmtChartAxis = (n) => {
  if (!n) return '0'
  const isNegative = n < 0
  const a = Math.abs(n)

  let val = ''
  if (a >= 1e9) {
    val = parseFloat((a / 1e9).toFixed(1)).toString().replace('.', ',') + 'M'
  } else if (a >= 1e6) {
    val = parseFloat((a / 1e6).toFixed(1)).toString().replace('.', ',') + 'Jt'
  } else if (a >= 1e3) {
    val = parseFloat((a / 1e3).toFixed(1)).toString().replace('.', ',') + 'K'
  } else {
    val = a.toString()
  }

  return (isNegative ? '-' : '') + val
}

// Fungsi untuk memformat Unit/Qty investasi
export const fmtUnit = (num) => {
  if (!num) return '0';
  return Number(num.toFixed(4)).toString();
}

export const QUICK_FILTERS = [
  { value: 'semua', label: 'Semua' },
  { value: 'bulan-ini', label: 'Bulan ini' },
  { value: '7-hari', label: '7 hari' },
  { value: 'makan-transport', label: 'Makan & transport' },
  { value: 'tagihan', label: 'Tagihan' },
]

export const isDateQuickFilterPreset = (preset) => preset === 'bulan-ini' || preset === '7-hari'

export const isCashflowExcludedCat = (cat) => cat === 'Transfer' || cat === 'Piutang' || cat === 'Pinjaman'
export const isDebtMutationTx = (tx) =>
  (tx?.cat === 'Transfer' && (tx?.sub_cat === 'Bayar Pinjaman' || tx?.sub_cat === 'Terima Pinjaman')) ||
  tx?.cat === 'Pinjaman'
export const isInternalTransferTx = (tx) =>
  tx?.cat === 'Transfer' && (!tx?.sub_cat || tx?.sub_cat === 'Transfer Keluar' || tx?.sub_cat === 'Transfer Masuk')
export const isInvestmentLiquidationTx = (tx) => tx?.type === 'in' && tx?.sub_cat === 'Tarik Investasi'
export const isInvestmentProfitTx = (tx) => tx?.type === 'in' && tx?.sub_cat === 'Profit Investasi'
export const isCashflowIncomeTx = (tx) => tx?.type === 'in' && !isCashflowExcludedCat(tx?.cat) && !isDebtMutationTx(tx)
export const isCashflowExpenseTx = (tx) => tx?.type === 'out' && !isCashflowExcludedCat(tx?.cat) && !isDebtMutationTx(tx)
export const summarizeFinancialTx = (transactions = []) => {
  const income = transactions.filter((tx) => isCashflowIncomeTx(tx)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const investmentLiquidation = transactions.filter((tx) => isInvestmentLiquidationTx(tx)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const investmentProfit = transactions.filter((tx) => isInvestmentProfitTx(tx)).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const internalTransferIn = transactions
    .filter((tx) => tx?.type === 'in' && isInternalTransferTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const internalTransferOut = transactions
    .filter((tx) => tx?.type === 'out' && isInternalTransferTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const excludedIn = transactions
    .filter((tx) => tx?.type === 'in' && !isInternalTransferTx(tx) && !isCashflowIncomeTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const excludedOut = transactions
    .filter((tx) => tx?.type === 'out' && !isInternalTransferTx(tx) && !isCashflowExpenseTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const actualOut = transactions
    .filter((tx) => tx?.type === 'out' && !isInternalTransferTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const actualIn = transactions
    .filter((tx) => tx?.type === 'in' && !isInternalTransferTx(tx))
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  const expense = Math.max(0, actualOut - excludedIn)

  return {
    income,
    realIncome: Math.max(0, income - investmentProfit),
    expense,
    net: income - expense,
    investmentLiquidation,
    investmentProfit,
    actualIn,
    actualOut,
    excludedIn,
    excludedOut,
    internalTransferIn,
    internalTransferOut,
  }
}

export const matchesQuickFilterPreset = (tx, preset = 'semua', referenceDate = new Date()) => {
  if (!tx || preset === 'semua') return true

  const txDate = tx.date || tx.tgl || ''
  const desc = String(tx.desc || tx.keterangan || '').toLowerCase()
  const mainCat = getCashflowMainCategory(tx)
  const currentYM = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`

  if (preset === 'bulan-ini') return txDate.startsWith(currentYM)

  if (preset === '7-hari') {
    const end = new Date(referenceDate)
    end.setHours(0, 0, 0, 0)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    const txTime = new Date(`${txDate}T00:00:00`).getTime()
    return Number.isFinite(txTime) && txTime >= start.getTime() && txTime <= end.getTime()
  }

  if (preset === 'makan-transport') {
    return mainCat === 'Konsumsi & Makan' || mainCat === 'Transportasi'
  }

  if (preset === 'tagihan') {
    return mainCat === 'Tagihan & Utilitas' || Boolean(tx?.bill_id) || desc.includes('bayar tagihan')
  }

  return true
}
export const getCashflowMainCategory = (tx) => {
  if (isDebtMutationTx(tx)) return 'Kewajiban & Cicilan'
  return tx?.cat || 'Lainnya'
}
export const getExpenseDistributionCategory = (tx) => {
  if (!tx) return 'Lainnya'
  if (isDebtMutationTx(tx) && tx?.type === 'out') return 'Kewajiban & Cicilan'
  if (tx?.type === 'out' && tx?.sub_cat === 'Beli Investasi') return 'Investasi & Alokasi'
  return getCashflowMainCategory(tx)
}
export const getCashflowDisplayCategory = (tx) => {
  const mainCat = getCashflowMainCategory(tx)
  const subCat = tx?.sub_cat || ''
  if (!subCat || subCat === mainCat) return mainCat
  return `${mainCat} › ${subCat}`
}

export const today = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const MONTHS      = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
export const MONTHS_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

// 👇 PENGGANTI `CATEGORIES` - SEKARANG BERBENTUK POHON (TREE) 👇
export const CATEGORY_TREE = {
  "in": { // Khusus Pemasukan
    "Pemasukan Utama": ["Gaji Bulanan", "Tunjangan", "Lembur", "Bonus", "Lainnya"],
    "Bisnis & Sampingan": ["Penjualan", "Freelance", "Laba Usaha", "Lainnya"],
    "Lainnya": ["Hadiah/Pemberian", "Pencairan Dana", "Cashback", "Lainnya"]
  },
  "out": { // Khusus Pengeluaran
    "Konsumsi & Makan": ["Bahan Dapur", "Makan di Luar", "Kopi & Jajan", "Jajan Adek", "Lainnya"],
    "Transportasi": ["Bensin", "Parkir", "Tol", "Transportasi Umum", "Servis Kendaraan", "Lainnya"],
    "Tagihan & Utilitas": ["Listrik", "Air", "Internet & WiFi", "Pulsa & Paket Data", "Lainnya"],
    "Kebutuhan Rumah": ["Belanja Bulanan", "Perabotan", "Kebersihan", "Laundry", "Elektronik & Gadget", "Lainnya"],
    "Kewajiban & Cicilan": ["Bayar Cicilan", "Kewajiban", "Pajak", "Asuransi", "Lainnya"],
    "Kesehatan": ["Obat-obatan", "Dokter / RS", "Perawatan", "Lainnya"],
    "Gaya Hidup": ["Pakaian", "Kosmetik & Skincare", "Langganan Digital", "Hobi", "Lainnya"],
    "Edukasi & Pelatihan": ["Buku", "Kursus / Pelatihan", "Keperluan Sekolah", "Lainnya"],
    "Lainnya": ["Kejadian Tak Terduga", "Sedekah & Donasi", "Belanja Lainnya", "Lainnya"]
  }
};

export const CHART_COLORS = [
  '#E8353A','#2196F3','#4CAF50','#F5A623','#9C27B0',
  '#00BCD4','#FF5722','#607D8B','#E91E63','#3F51B5',
  '#009688','#FFC107','#8BC34A','#FF9800','#795548',
]

// 👇 CAT_ICONS DIRINGKAS HANYA UNTUK KATEGORI INDUK 👇
export const CAT_ICONS = {
  // Induk Pengeluaran
  'Konsumsi & Makan':      <Utensils size={16} className="inline-block mr-1.5 text-orange-500 dark:text-orange-400" />,
  'Transportasi':          <Car size={16} className="inline-block mr-1.5 text-sky-500 dark:text-sky-400" />,
  'Tagihan & Utilitas':    <Receipt size={16} className="inline-block mr-1.5 text-indigo-500 dark:text-indigo-400" />,
  'Kebutuhan Rumah':       <Home size={16} className="inline-block mr-1.5 text-teal-500 dark:text-teal-400" />,
  'Kewajiban & Cicilan':   <CreditCard size={18} className="text-rose-500 dark:text-rose-400" />,
  'Kesehatan':             <Pill size={16} className="inline-block mr-1.5 text-rose-500 dark:text-rose-400" />,
  'Gaya Hidup':            <Shirt size={16} className="inline-block mr-1.5 text-pink-500 dark:text-pink-400" />,
  'Edukasi & Pelatihan':   <BookOpen size={16} className="inline-block mr-1.5 text-cyan-500 dark:text-cyan-400" />,
  
  // Induk Pemasukan & Investasi
  'Pemasukan Utama':       <Banknote size={16} className="inline-block mr-1.5 text-emerald-600 dark:text-emerald-400" />,
  'Bisnis & Sampingan':    <Briefcase size={16} className="inline-block mr-1.5 text-blue-500 dark:text-blue-400" />,
  'Investasi':             <TrendingUp size={16} className="inline-block mr-1.5 text-blue-500 dark:text-blue-400" />, 
  'Lainnya':               <Sparkles size={16} className="inline-block mr-1.5 text-slate-400 dark:text-slate-300" />, 
  'Elektronik & Gadget': <Laptop size={16} />
}

export function getDescEmoji(desc = '') {
  if (!desc) return null
  const rule = EMOJI_RULES.find(r => r.pattern.test(desc))
  return rule ? rule.emoji : null
}

export const INV_TYPES = {
  Reksadana: {
    icon: <BarChart3 size={20} />,
    color: '#2196F3',
    subTypes: [
      'Reksa Dana Pasar Uang',
      'Reksa Dana Pendapatan Tetap',
      'Reksa Dana Campuran',
      'Reksa Dana Saham',
      'Reksa Dana Indeks',
      'Reksa Dana ETF',
    ],
    unit: 'Unit',
    unitLabel: 'Jumlah Unit',
    unitPlaceholder: 'Mis. 100.5',
  },
  Saham: {
    icon: <TrendingUp size={20} />,
    color: '#E8353A',
    subTypes: [
      'BBCA','BBRI','BMRI','TLKM','ASII',
      'GOTO','BREN','ADRO','ANTM','UNVR',
      'ICBP','INDF','SMGR','GGRM','HMSP',
      'Lainnya',
    ],
    unit: 'Lot',
    unitLabel: 'Jumlah Lot',
    unitPlaceholder: 'Mis. 10',
  },
  Emas: {
    icon: <Coins size={20} />, 
    color: '#F5A623',
    subTypes: [
      'Emas Antam',
      'Emas UBS',
      'Emas Pegadaian',
      'Tabungan Emas',
      'Emas Digital',
    ],
    unit: 'Gram',
    unitLabel: 'Berat (Gram)',
    unitPlaceholder: 'Mis. 5',
  },
  Uang: {
    icon: <Wallet size={20} />,
    color: '#4CAF50',
    subTypes: [
      'Deposito',
      'Tabungan Berjangka',
      'SBN / Obligasi',
      'ORI',
      'Sukuk',
      'P2P Lending',
      'Cash'
    ],
    unit: 'Nominal',
    unitLabel: 'Nominal (Rp)',
    unitPlaceholder: 'Otomatis dari jumlah',
  },
}
