import HealthScoreWidget from '../components/HealthScoreWidget'
import NetWorthWidget    from '../components/NetWorthWidget'
import RekomWidget       from '../components/RekomWidget'
import { Sparkles, Brain } from 'lucide-react'

export default function Insights() {
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <header className="relative bg-text rounded-[28px] p-7 md:p-9 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.35)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.2)' }} />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 items-center justify-center flex-shrink-0 hidden md:flex">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <Sparkles size={10} /> Analisis Keuangan
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Insights Keuangan</h1>
            <p className="text-sm font-medium mt-1.5 max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Analisis mendalam kondisi &amp; kesehatan keuangan kamu secara real-time.
            </p>
          </div>
        </div>
      </header>

      {/* Health Score + Net Worth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HealthScoreWidget />
        <NetWorthWidget />
      </div>

      {/* Rekomendasi */}
      <RekomWidget />

    </div>
  )
}
