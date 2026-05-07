import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, LayoutDashboard, ArrowRightLeft, BarChart3, Sparkles,
  TrendingUp, Target, CreditCard, ChevronRight, Lightbulb,
  Plus, Search, Download, Wallet, ShieldCheck, Zap
} from 'lucide-react'

const SECTIONS = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    title: 'Dashboard — Pusat Kendali Keuangan',
    desc: 'Halaman utama yang menampilkan ringkasan lengkap kondisi keuanganmu dalam satu pandangan.',
    steps: [
      { title: 'Cek Total Saldo', body: 'Widget saldo di bagian atas menampilkan total dari semua dompet yang kamu miliki secara real-time.' },
      { title: 'Pantau Kartu Statistik', body: 'Tiga kartu (Pemasukan, Pengeluaran, Arus Kas Bersih) menunjukkan performa keuangan bulan ini dibanding bulan lalu dengan indikator tren.' },
      { title: 'Baca Grafik Tren', body: 'Grafik area 6 bulan membandingkan pemasukan dan pengeluaran tiap bulan agar kamu bisa lihat pola keuangan dari waktu ke waktu.' },
      { title: 'Tambah Transaksi Cepat', body: 'Gunakan tombol Quick Add di pojok bawah layar untuk mencatat transaksi tanpa perlu pindah halaman.' },
      { title: 'Bill Tracker', body: 'Kartu tagihan yang akan jatuh tempo ditampilkan di dashboard agar kamu tidak ketinggalan pembayaran apapun.' },
    ],
    tips: [
      { icon: Zap, text: 'Klik kartu statistik untuk langsung loncat ke halaman Laporan bulan tersebut.' },
      { icon: Wallet, text: 'Kelola dompet (tambah, edit, transfer) lewat widget Dompet di bagian bawah dashboard.' },
    ],
  },
  {
    id: 'transaksi',
    icon: ArrowRightLeft,
    label: 'Transaksi',
    color: '#14B8A6',
    bg: 'rgba(20,184,166,0.08)',
    title: 'Transaksi — Catat Setiap Arus Kas',
    desc: 'Pusat pencatatan pemasukan dan pengeluaran harian dengan fitur kategorisasi otomatis berbasis AI.',
    steps: [
      { title: 'Pilih Tipe Transaksi', body: 'Pilih "Pemasukan" (uang masuk) atau "Pengeluaran" (uang keluar) menggunakan tombol di bagian atas form.' },
      { title: 'Isi Keterangan', body: 'Ketik nama toko, sumber, atau keterangan transaksi. Sistem akan otomatis mengisi kategori berdasarkan riwayat transaksi serupa sebelumnya.' },
      { title: 'Masukkan Nominal', body: 'Tulis angka tanpa titik atau koma — sistem memformat otomatis. Tekan Enter untuk langsung menyimpan.' },
      { title: 'Pilih Kategori & Sub-Kategori', body: 'Pilih kategori utama (misal: Makanan) lalu sub-kategori yang lebih spesifik (misal: Restoran). Ini membantu laporan jadi lebih detail.' },
      { title: 'Pilih Dompet & Tanggal', body: 'Tentukan dari/ke dompet mana transaksi ini, dan tanggal kejadian sebenarnya.' },
      { title: 'Filter & Cari', body: 'Gunakan filter bulan, tipe, dan kolom pencarian di daftar transaksi untuk menemukan transaksi tertentu.' },
    ],
    tips: [
      { icon: Zap, text: 'Fitur Auto-Kategori: sistem mengingat kategori dari transaksi sebelumnya dengan deskripsi serupa.' },
      { icon: Search, text: 'Nominal terakhir yang pernah dipakai muncul sebagai tombol shortcut di bawah kolom nominal.' },
    ],
  },
  {
    id: 'laporan',
    icon: BarChart3,
    label: 'Laporan',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.08)',
    title: 'Laporan — Analisis Visual Keuangan',
    desc: 'Laporan detail per bulan atau per tahun lengkap dengan grafik distribusi dan fitur ekspor.',
    steps: [
      { title: 'Pilih Periode', body: 'Gunakan tombol navigasi bulan/tahun di bagian atas untuk memilih periode laporan yang ingin dilihat.' },
      { title: 'Tab Laporan Bulanan', body: 'Tampilkan ringkasan bulan yang dipilih: total pemasukan, pengeluaran, distribusi kategori, dan daftar transaksi.' },
      { title: 'Tab Laporan Tahunan', body: 'Lihat rangkuman 12 bulan sekaligus dengan grafik bar perbandingan pemasukan vs pengeluaran tiap bulan.' },
      { title: 'Tab Grafik', body: 'Analisis visual mendalam dengan grafik area dan pie chart distribusi pengeluaran per kategori.' },
      { title: 'Export Laporan', body: 'Klik tombol "Export Laporan" untuk mengunduh data ke format PDF (laporan formal siap cetak) atau Excel (data mentah untuk analisis).' },
    ],
    tips: [
      { icon: Download, text: 'PDF Export cocok untuk arsip atau berbagi dengan keluarga. Excel Export cocok untuk analisis lebih lanjut di spreadsheet.' },
      { icon: Lightbulb, text: 'Laporan tahunan tersedia di tab "Tahunan" — sangat berguna untuk evaluasi akhir tahun.' },
    ],
  },
  {
    id: 'insights',
    icon: Sparkles,
    label: 'Insights',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.08)',
    title: 'Insights — Analisis Keuangan Cerdas',
    desc: 'Analisis mendalam kondisi keuangan dengan Health Score, Net Worth tracker, dan rekomendasi personal.',
    steps: [
      { title: 'Health Score', body: 'Skor 0-100 yang menggambarkan kesehatan keuanganmu berdasarkan rasio tabungan, konsistensi, dan keseimbangan arus kas.' },
      { title: 'Breakdown Skor', body: 'Lihat komponen penilaian detail: Savings Rate, Cash Flow Ratio, Emergency Fund, dan Spending Control.' },
      { title: 'Net Worth Tracker', body: 'Total aset (saldo + investasi) dikurangi total hutang. Pantau perkembangan kekayaan bersih dari waktu ke waktu.' },
      { title: 'Rekomendasi Personal', body: 'Sistem menganalisis pola pengeluaran dan memberikan saran spesifik: penghematan yang mungkin, target tabungan, atau peringatan pengeluaran berlebih.' },
    ],
    tips: [
      { icon: Sparkles, text: 'Health Score di atas 70 berarti keuanganmu sudah dalam kondisi baik. Targetkan di atas 80 untuk kondisi sangat sehat.' },
      { icon: Lightbulb, text: 'Rekomendasi diperbarui otomatis setiap kali kamu menambah transaksi baru.' },
    ],
  },
  {
    id: 'investasi',
    icon: TrendingUp,
    label: 'Investasi',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    title: 'Investasi — Kelola Portofolio Aset',
    desc: 'Pantau semua investasi (saham, reksa dana, emas, kripto) dalam satu tempat dan lacak keuntungannya.',
    steps: [
      { title: 'Catat Pembelian Aset', body: 'Klik "Beli Aset", pilih jenis investasi (Saham, Reksa Dana, Emas, Kripto, dll.), isi nama instrumen, jumlah, dan harga beli.' },
      { title: 'Catat Penjualan', body: 'Saat menjual aset, klik "Jual Aset" dan isi detail yang sama. Selisih antara harga beli dan jual dicatat sebagai profit/rugi investasi.' },
      { title: 'Lihat Portofolio', body: 'Halaman investasi menampilkan daftar semua aset yang dimiliki, nilai total investasi, dan estimasi keuntungan/kerugian.' },
      { title: 'Grafik Distribusi', body: 'Pie chart menampilkan komposisi portofolio berdasarkan jenis aset agar mudah melihat diversifikasi investasi.' },
    ],
    tips: [
      { icon: TrendingUp, text: 'Profit dan rugi investasi otomatis terintegrasi ke laporan keuangan di halaman Laporan.' },
      { icon: Lightbulb, text: 'Gunakan sub-tipe untuk detail lebih spesifik, misal: "BBCA" untuk saham Bank BCA.' },
    ],
  },
  {
    id: 'target',
    icon: Target,
    label: 'Target Cerdas',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    title: 'Target Cerdas — Wujudkan Tujuan Finansial',
    desc: 'Buat target keuangan yang terukur dan pantau progres pencapaiannya secara real-time.',
    steps: [
      { title: 'Buat Target Baru', body: 'Klik "Tambah Target", beri nama (misal: Dana Darurat, Liburan Bali), tentukan nominal target, dan pilih tanggal deadline.' },
      { title: 'Atur Saldo Awal', body: 'Jika sudah ada tabungan yang disisihkan, masukkan saldo awal target agar progres dihitung dari jumlah yang tepat.' },
      { title: 'Pantau Progres', body: 'Progress bar menunjukkan persentase pencapaian. Semakin mendekati target, warna progress semakin hijau.' },
      { title: 'Estimasi Pencapaian', body: 'Sistem menghitung estimasi kapan target akan tercapai berdasarkan rata-rata tabungan bulananmu.' },
      { title: 'Tandai Selesai', body: 'Saat target sudah tercapai, tandai sebagai "Selesai" untuk mengarsipkan dan merayakan pencapaianmu.' },
    ],
    tips: [
      { icon: Target, text: 'Rekomendasikan mengisi minimal 3-6 bulan pengeluaran sebagai Dana Darurat sebagai target pertama.' },
      { icon: Lightbulb, text: 'Buat target kecil yang realistis agar motivasi tetap terjaga. Target besar bisa dipecah menjadi beberapa sub-target.' },
    ],
  },
  {
    id: 'hutang',
    icon: CreditCard,
    label: 'Hutang & Tagihan',
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    title: 'Hutang & Tagihan — Kelola Kewajiban Finansial',
    desc: 'Catat dan pantau semua hutang, cicilan, dan tagihan agar tidak ada yang terlewat atau terlambat bayar.',
    steps: [
      { title: 'Tambah Hutang Baru', body: 'Catat hutang dengan nama pemberi pinjaman/kreditur, total nominal, dan tanggal mulai. Bisa untuk hutang personal, KPR, kartu kredit, dll.' },
      { title: 'Atur Cicilan Bulanan', body: 'Masukkan nominal cicilan per bulan dan tanggal jatuh tempo. Sistem akan mengingatkan saat mendekati tanggal bayar.' },
      { title: 'Pantau Sisa Hutang', body: 'Setiap cicilan yang dicatat otomatis mengurangi sisa pokok hutang, sehingga kamu selalu tahu berapa yang masih harus dibayar.' },
      { title: 'Tandai Lunas', body: 'Saat hutang sudah terlunasi sepenuhnya, tandai sebagai "Lunas" untuk memindahkannya ke arsip.' },
    ],
    tips: [
      { icon: ShieldCheck, text: 'Hutang yang hampir jatuh tempo akan muncul di dashboard sebagai pengingat prioritas.' },
      { icon: Lightbulb, text: 'Gunakan fitur ini untuk melacak hutang ke teman/keluarga agar tidak ada yang terlupa di kedua pihak.' },
    ],
  },
]

export default function PanduanModal({ onClose }) {
  const [activeId, setActiveId] = useState('dashboard')
  const active = SECTIONS.find(s => s.id === activeId)
  const ActiveIcon = active.icon

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan Fitur DompetKu Pro"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
              <Lightbulb size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Dokumentasi</p>
              <h2 className="font-black text-base text-text leading-tight">Panduan Fitur DompetKu Pro</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup panduan"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-text hover:bg-bg border border-transparent hover:border-border transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

          {/* Left: Tab Nav */}
          <aside className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible overflow-y-visible lg:overflow-y-auto
            p-3 lg:p-4 border-b lg:border-b-0 lg:border-r border-border bg-surface flex-shrink-0
            lg:w-52 custom-scrollbar"
            aria-label="Navigasi fitur">
            {SECTIONS.map(s => {
              const Icon = s.icon
              const isActive = s.id === activeId
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all flex-shrink-0 lg:flex-shrink border border-transparent w-max lg:w-full"
                  style={isActive ? {
                    backgroundColor: s.bg,
                    borderColor: s.color + '30',
                  } : {}}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isActive ? s.color : 'var(--color-bg)' }}
                  >
                    <Icon size={14} style={{ color: isActive ? '#fff' : s.color }} />
                  </div>
                  <span
                    className="text-xs font-bold whitespace-nowrap lg:whitespace-normal"
                    style={{ color: isActive ? s.color : 'var(--color-muted)' }}
                  >
                    {s.label}
                  </span>
                  {isActive && <ChevronRight size={12} className="hidden lg:block ml-auto flex-shrink-0" style={{ color: s.color }} />}
                </button>
              )
            })}
          </aside>

          {/* Right: Content */}
          <main className="flex-1 overflow-y-auto p-5 md:p-7 custom-scrollbar">

            {/* Section header */}
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ background: `linear-gradient(135deg, ${active.color}, ${active.color}cc)` }}
              >
                <ActiveIcon size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-text leading-tight mb-1">{active.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{active.desc}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Cara Menggunakan</p>
              <ol className="space-y-3 list-none p-0">
                {active.steps.map((step, i) => (
                  <li key={i} className="flex gap-3.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[11px] font-black shadow-sm"
                      style={{ backgroundColor: active.color }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3">
                      <p className="font-bold text-sm text-text mb-0.5">{step.title}</p>
                      <p className="text-xs text-muted leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: active.bg, borderColor: active.color + '25' }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ color: active.color }}
              >
                Tips &amp; Pintasan
              </p>
              <div className="space-y-2.5">
                {active.tips.map((tip, i) => {
                  const TipIcon = tip.icon
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: active.color + '20' }}
                      >
                        <TipIcon size={12} style={{ color: active.color }} />
                      </div>
                      <p className="text-xs text-text-2 leading-relaxed">{tip.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation hint */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <button
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeId)
                  if (idx > 0) setActiveId(SECTIONS[idx - 1].id)
                }}
                disabled={SECTIONS.findIndex(s => s.id === activeId) === 0}
                className="text-xs font-bold text-muted hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                ← Sebelumnya
              </button>
              <span className="text-[10px] text-muted">
                {SECTIONS.findIndex(s => s.id === activeId) + 1} / {SECTIONS.length}
              </span>
              <button
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeId)
                  if (idx < SECTIONS.length - 1) setActiveId(SECTIONS[idx + 1].id)
                }}
                disabled={SECTIONS.findIndex(s => s.id === activeId) === SECTIONS.length - 1}
                className="text-xs font-bold hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                style={{ color: active.color }}
              >
                Selanjutnya →
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>,
    document.body
  )
}
