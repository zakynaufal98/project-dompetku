import HealthScoreWidget from '../components/HealthScoreWidget'
import NetWorthWidget    from '../components/NetWorthWidget'
import { Sparkles } from 'lucide-react'

export default function Insights() {
  return (
    <div className="animate-fade-up space-y-5 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-primary" />
          <h1 className="font-bold text-xl text-text tracking-tight">Insights Keuangan</h1>
        </div>
        <p className="text-muted text-sm font-medium">
          Analisis mendalam kondisi &amp; kesehatan keuangan kamu
        </p>
      </div>

      {/* 2 kolom: Health Score + Net Worth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HealthScoreWidget />
        <NetWorthWidget />
      </div>

    </div>
  )
}
