import { 
  Receipt, 
  Home, 
  Utensils, 
  Car, 
  ClipboardList, 
  PiggyBank, 
  Pill, 
  Shirt, 
  Zap, 
  BookOpen, 
  IceCream, 
  ShoppingBag, 
  Sparkles, 
  Droplets, 
  CircleParking, 
  Banknote,
  BarChart3,
  TrendingUp,
  Coins,
  Wallet,
  CreditCard,
  Briefcase,
  Laptop
} from 'lucide-react'

// Fungsi untuk format Rupiah penuh
export const fmt = (n) => {
  if (!n) return 'Rp\u00A00'; 
  const isNegative = n < 0; 
  const formatted = Math.abs(n).toLocaleString('id-ID'); 
  return (isNegative ? '-' : '') + 'Rp\u00A0' + formatted;
}

// Fungsi untuk format Rupiah penuh (bisa dipanggil di mana saja)
export const fmtShort = (n) => {
  if (!n) return 'Rp\u00A00'; 
  const isNegative = n < 0;
  const val = Math.abs(n).toLocaleString('id-ID');
  return (isNegative ? '-' : '') + 'Rp\u00A0' + val;
}

// Khusus untuk label sumbu Y pada grafik agar tidak terpotong
export const fmtChartAxis = (n) => {
  if (!n) return '0'; 
  
  const isNegative = n < 0;
  const a = Math.abs(n);
  
  let val = '';
  if (a >= 1e9) {
    val = parseFloat((a / 1e9).toFixed(1)).toString().replace('.', ',') + 'M';
  } else if (a >= 1e6) {
    val = parseFloat((a / 1e6).toFixed(1)).toString().replace('.', ',') + 'Jt';
  } else if (a >= 1e3) {
    val = parseFloat((a / 1e3).toFixed(1)).toString().replace('.', ',') + 'K';
  } else {
    val = a.toString();
  }

  return (isNegative ? '-' : '') + val;
}

// Fungsi untuk memformat Unit/Qty investasi
export const fmtUnit = (num) => {
  if (!num) return '0';
  return Number(num.toFixed(4)).toString();
}

export const today = () => new Date().toISOString().split('T')[0]

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