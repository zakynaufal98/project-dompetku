import { createPortal } from 'react-dom'
import { BookOpen, X } from 'lucide-react'

const DEFINITIONS = [
  {
    title: 'Pemasukan Riil',
    body: 'Pendapatan yang benar-benar menambah hasil keuanganmu, seperti gaji, bonus, tunjangan, hadiah, atau pemasukan usaha. Pencairan investasi dan pinjaman tidak dimasukkan ke sini.',
  },
  {
    title: 'Pengeluaran Bersih',
    body: 'Uang keluar yang mencerminkan beban bulan berjalan setelah transfer internal diabaikan, lalu offset dari arus masuk non-pendapatan seperti pinjaman atau tarik modal investasi ikut diperhitungkan.',
  },
  {
    title: 'Transfer Internal',
    body: 'Perpindahan uang antar dompet atau rekening milikmu sendiri. Ini mengubah posisi uang per dompet, tapi tidak dianggap pemasukan atau pengeluaran pada laporan.',
  },
]

export default function FinancialDefinitionsModal({ open, onClose }) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-[30px] rounded-b-[24px] border border-border bg-surface shadow-2xl sm:rounded-[32px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-pale text-text">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Pusat Definisi</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-text">Pusat Definisi Keuangan</h3>
              <p className="mt-1 text-sm font-medium text-muted">Acuan istilah agar angka di dashboard, transaksi, dan laporan terasa konsisten.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg text-muted transition-colors hover:text-expense"
            aria-label="Tutup pusat definisi keuangan"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {DEFINITIONS.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-border bg-bg/70 p-4">
              <p className="text-sm font-black text-text">{item.title}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-2">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
