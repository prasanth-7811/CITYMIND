import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { SimulationResult } from '../types'

interface Props {
  result: SimulationResult
}

export default function ExplainabilityPanel({ result }: Props) {
  const total = result.explanation.reduce((s, f) => s + f.impact, 0)

  const radarData = result.explanation.map(f => ({
    factor: f.factor.split(' ').slice(0, 2).join(' '),
    value: f.impact,
  }))

  return (
    <div className="bg-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🧠</span> Why This Prediction?
        </h2>
        <div className="text-right">
          <p className="text-xs text-slate-400">Risk Score</p>
          <p className={`text-xl font-black ${result.risk_score > 70 ? 'text-red-400' : result.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
            {result.risk_score}%
          </p>
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-3">
        {result.explanation.map((factor, i) => {
          const pct = total > 0 ? (factor.impact / total) * 100 : 0
          const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500']
          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{factor.factor}</span>
                <span className="text-white font-semibold">+{factor.impact}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Radar chart */}
      {radarData.length >= 3 && (
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* Context badges */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Ambient Context</p>
        <div className="flex flex-wrap gap-2">
          {result.context.peak_hour && <Badge label="Peak Hour" color="yellow" />}
          {result.context.weather_impact && <Badge label={`Weather: ${result.context.weather}`} color="blue" />}
          {result.context.large_event && <Badge label="Large Event Active" color="purple" />}
          {result.context.maintenance_active && <Badge label="Maintenance Active" color="orange" />}
          {result.context.high_report_density && <Badge label="High Report Density" color="red" />}
          {!result.context.peak_hour && !result.context.weather_impact && !result.context.large_event && (
            <Badge label="Normal Conditions" color="green" />
          )}
        </div>
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    blue: 'bg-blue-900/40 text-blue-300 border-blue-700',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700',
    orange: 'bg-orange-900/40 text-orange-300 border-orange-700',
    red: 'bg-red-900/40 text-red-300 border-red-700',
    green: 'bg-green-900/40 text-green-300 border-green-700',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${colors[color]}`}>{label}</span>
  )
}
