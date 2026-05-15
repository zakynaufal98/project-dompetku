import { useState } from 'react'
import HealthScoreWidget from '../components/HealthScoreWidget'
import NetWorthWidget from '../components/NetWorthWidget'
import RekomWidget from '../components/RekomWidget'
import FinancialDefinitionsModal from '../components/FinancialDefinitionsModal'
import { Sparkles, Brain, BookOpen } from 'lucide-react'

export default function Insights() {
  const [showDefinitions, setShowDefinitions] = useState(false)

  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">
      <header className="relative bg-text rounded-[28px] p-7 md:p-9 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.35)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.2)' }} />
        </div>

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 items-center justify-center flex-shrink-0 hidden md:flex">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}
              >
                <Sparkles size={10} /> Analisis Keuangan
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Insights Keuangan</h1>
              <p className="text-sm font-medium mt-1.5 max-w-xl" style={{ color: 'rgba(255,255,255,0.68)' }}>
                Dibaca dari pemasukan riil, pengeluaran bersih, tagihan, dan anggaran agar lebih nyambung dengan dashboard dan laporan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDefinitions(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/14"
          >
            <BookOpen size={14} />
            Pusat definisi keuangan
          </button>
        </div>

        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          {['Pemasukan Riil', 'Pengeluaran Bersih', 'Transfer Internal diabaikan'].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80"
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HealthScoreWidget />
        <NetWorthWidget />
      </div>

      <RekomWidget />

      <FinancialDefinitionsModal open={showDefinitions} onClose={() => setShowDefinitions(false)} />
    </div>
  )
}
