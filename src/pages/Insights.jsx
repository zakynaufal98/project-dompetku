import HealthScoreWidget from '../components/HealthScoreWidget'
import NetWorthWidget    from '../components/NetWorthWidget'
import RekomWidget       from '../components/RekomWidget'
import { Sparkles, Brain } from 'lucide-react'

export default function Insights() {
  return (
    <div className="animate-fade-up space-y-6 max-w-7xl mx-auto pb-10">

      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 rounded-[32px] p-8 md:p-10 shadow-lg text-white">
        <div className="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-10 left-0 w-56 h-56 bg-black/10 blur-[60px] rounded-full" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center shadow-inner hidden md:flex">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-white/20">
              <Sparkles size={12} /> Analisis Keuangan
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm">Insights Keuangan</h1>
            <p className="text-white/80 text-sm font-medium mt-1.5 max-w-md">
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
