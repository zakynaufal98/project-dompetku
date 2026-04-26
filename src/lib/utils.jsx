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
  CreditCard
} from 'lucide-react'

// Fungsi untuk format Rupiah penuh (contoh: -Rp 200.000)
export const fmt = (n) => {
  if (!n) return 'Rp 0'; // Jaga-jaga jika nilainya kosong/0
  const isNegative = n < 0; // Cek apakah nilainya minus
  const formatted = Math.abs(n).toLocaleString('id-ID'); // Format angkanya saja
  
  // Jika minus, tambahkan '-' di depan 'Rp'
  return (isNegative ? '-' : '') + 'Rp ' + formatted;
}

// Fungsi untuk format Rupiah singkatan
// Fungsi untuk format Rupiah singkatan (SUDAH DIPERBAIKI UNTUK PECAHAN)
export const fmtShort = (n) => {
  // Gunakan \u00A0 sebagai ganti spasi biasa
  if (!n) return 'Rp\u00A00'; 
  
  const isNegative = n < 0;
  const a = Math.abs(n);
  
  let val = '';
  // parseFloat akan membuang nol ekstra (misal 1.0 jadi 1)
  // replace('.', ',') untuk mengubah desimal Inggris ke format Indonesia
  if (a >= 1e9) {
    val = parseFloat((a / 1e9).toFixed(2)).toString().replace('.', ',') + 'M';
  } else if (a >= 1e6) {
    val = parseFloat((a / 1e6).toFixed(2)).toString().replace('.', ',') + 'jt';
  } else if (a >= 1e3) {
    val = parseFloat((a / 1e3).toFixed(2)).toString().replace('.', ',') + 'rb';
  } else {
    val = a.toLocaleString('id-ID');
  }

  // Gabungkan tanda minus, Rp, dan angkanya menggunakan \u00A0
  return (isNegative ? '-' : '') + 'Rp\u00A0' + val;
}

// TAMBAHAN BARU: Fungsi untuk memformat Unit/Qty investasi (maks 4 desimal, otomatis rapi)
export const fmtUnit = (num) => {
  if (!num) return '0';
  return Number(num.toFixed(4)).toString();
}

export const today = () => new Date().toISOString().split('T')[0]

export const MONTHS      = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
export const MONTHS_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export const CATEGORIES = [
  'Tagihan','Kebutuhan Rumah Tangga','Konsumsi & Makan',
  'Transportasi','Kewajiban', 'Bayar Cicilan','Tabungan & Investasi',
  'Kesehatan','Pakaian','Kejadian Tak Terduga',
  'Pelatihan & Lainnya','Jajan Adek','Belanja Lainnya',
  'Kosmetik','Laundry','Parkir','Lainnya'
]

export const CHART_COLORS = [
  '#E8353A','#2196F3','#4CAF50','#F5A623','#9C27B0',
  '#00BCD4','#FF5722','#607D8B','#E91E63','#3F51B5',
  '#009688','#FFC107','#8BC34A','#FF9800','#795548',
]

// Emoji diganti dengan komponen Lucide React
export const CAT_ICONS = {
  'Tagihan':               <Receipt size={16} className="inline-block mr-1.5 text-indigo-500" />,
  'Kebutuhan Rumah Tangga':<Home size={16} className="inline-block mr-1.5 text-teal-500" />,
  'Konsumsi & Makan':      <Utensils size={16} className="inline-block mr-1.5 text-orange-500" />,
  'Transportasi':          <Car size={16} className="inline-block mr-1.5 text-sky-500" />,
  'Kewajiban':             <ClipboardList size={16} className="inline-block mr-1.5 text-slate-500" />,
  'Bayar Cicilan':         <CreditCard size={18} className="text-rose-500" />,
  'Tabungan & Investasi':  <PiggyBank size={16} className="inline-block mr-1.5 text-emerald-500" />,
  'Kesehatan':             <Pill size={16} className="inline-block mr-1.5 text-rose-500" />,
  'Pakaian':               <Shirt size={16} className="inline-block mr-1.5 text-pink-500" />,
  'Kejadian Tak Terduga':  <Zap size={16} className="inline-block mr-1.5 text-yellow-500" />,
  'Pelatihan & Lainnya':   <BookOpen size={16} className="inline-block mr-1.5 text-cyan-500" />,
  'Jajan Adek':            <IceCream size={16} className="inline-block mr-1.5 text-fuchsia-500" />,
  'Belanja Lainnya':       <ShoppingBag size={16} className="inline-block mr-1.5 text-purple-500" />,
  'Kosmetik':              <Sparkles size={16} className="inline-block mr-1.5 text-rose-400" />,
  'Laundry':               <Droplets size={16} className="inline-block mr-1.5 text-sky-400" />,
  'Parkir':                <CircleParking size={16} className="inline-block mr-1.5 text-slate-400" />,
  'Pemasukan':             <Banknote size={16} className="inline-block mr-1.5 text-emerald-600" />,
  'lainnya':               <Sparkles size={16} className="inline-block mr-1.5 text-gray-400" />,
}

// Investasi types dengan sub-jenis dan satuan (Ikon diupdate)
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
    icon: <Coins size={20} />, // Lucide tidak punya gold bar, Coins adalah alternatif terbaik
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