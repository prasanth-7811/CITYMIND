import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { SimulationResult } from '../types'

interface Props { result: SimulationResult }

const FACTOR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500']

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    blue:   'bg-blue-900/40 text-blue-300 border-blue-700',
    purple: 'bg-purple-900/40 text-purple-300 border-purple-700',
    orange: 'bg-orange-900/40 text-orange-300 border-orange-700',
    red:    'bg-red-900/40 text-red-300 border-red-700',
    green:  'bg-green-900/40 text-green-300 border-green-700',
  }
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[color]}`}>{label}</span>
}

export default function ExplainabilityPanel({ result }: Props) {
  const total = result.explanation.reduce((s, f) => s + f.impact, 0)
  const radarData = result.explanation.map(f => ({
    factor: f.factor.split(' ').slice(0, 2).join(' '),
    value: f.impact,
  }))

  return (
    <div className="bg-slate-800 rounded-xl p-5 space-y-4 border border-slate-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🧠</span> Why This Prediction?
        </h2>
        <div className="text-right">
          <p className="text-xs text-slate-400">Risk Score</p>
          <p className={`text-2xl font-black ${result.risk_score > 70 ? 'text-red-400' : result.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
            {result.risk_score}%
          </p>
        </div>
      </div>

      {/* Model badges */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-purple-900/50 border border-purple-600 text-purple-300 font-semibold">
          🤖 Random Forest (scikit-learn)
        </span>
        {result.ml_congestion && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 border border-blue-600 text-blue-300">
            ML Output: {result.ml_congestion}% congestion
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 border border-slate-500 text-slate-400">
          Trained on 5,000 synthetic samples
        </span>
      </div>

      {/* Plain-language summary */}
      {result.explanation_summary && (
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Plain-Language Summary</p>
          <p className="text-sm text-slate-200 leading-relaxed">{result.explanation_summary}</p>
        </div>
      )}

      {/* Prediction architecture */}
      <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Prediction Architecture</p>
        <div className="flex items-center gap-1 flex-wrap text-xs">
          {['City State', 'Digital Twin', 'Risk Engine (40%)', 'Random Forest (60%)', 'Blended Prediction'].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded ${i === 2 ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : i === 3 ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : i === 4 ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                {s}
              </span>
              {i < arr.length - 1 && <span className="text-slate-600">→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Factor bars */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Feature Importances (from RF model)</p>
        <div className="space-y-2.5">
          {result.explanation.map((factor, i) => {
            const pct = total > 0 ? (factor.impact / total) * 100 : 0
            return (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{factor.factor}</span>
                  <span className="text-white font-semibold">+{factor.impact}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-700 ${FACTOR_COLORS[i % FACTOR_COLORS.length]}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Radar chart */}
      {radarData.length >= 3 && (
        <ResponsiveContainer width="100%" height={170}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {/* Ambient context */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Ambient Context Detected</p>
        <div className="flex flex-wrap gap-2">
          {result.context.peak_hour && <Badge label="🕐 Peak Hour" color="yellow" />}
          {result.context.weather_impact && <Badge label={`🌧 ${result.context.weather?.replace('_',' ')}`} color="blue" />}
          {result.context.large_event && <Badge label="🎉 Large Event Active" color="purple" />}
          {result.context.maintenance_active && <Badge label="🔧 Maintenance Active" color="orange" />}
          {result.context.high_report_density && <Badge label="📍 High Report Density" color="red" />}
          {result.context.emergency_blocked_nodes > 0 && (
            <Badge label={`🏥 ${result.context.emergency_blocked_nodes} nodes blocked`} color="red" />
          )}
          {!result.context.peak_hour && !result.context.weather_impact && !result.context.large_event && (
            <Badge label="✅ Normal Conditions" color="green" />
          )}
        </div>
      </div>
    </div>
  )
}
