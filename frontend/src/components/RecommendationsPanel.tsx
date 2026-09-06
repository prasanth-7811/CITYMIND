import { SimulationResult } from '../types'

interface Props {
  result: SimulationResult
  applied: boolean
  onApply: () => void
  applying: boolean
}

function getIcon(text: string): string {
  if (text.includes('Redirect') || text.includes('bypass')) return '🔀'
  if (text.includes('bus') || text.includes('TNSTC') || text.includes('Bus')) return '🚌'
  if (text.includes('Hospital') || text.includes('emergency') || text.includes('GKNM')) return '🏥'
  if (text.includes('notification') || text.includes('depart') || text.includes('app')) return '📢'
  if (text.includes('speed') || text.includes('signal')) return '🚦'
  if (text.includes('warden') || text.includes('officer') || text.includes('Police')) return '👮'
  if (text.includes('advisory') || text.includes('avoid')) return '⚠️'
  if (text.includes('frequency') || text.includes('corridor')) return '🤝'
  if (text.includes('Monitor') || text.includes('manageable')) return '👁️'
  return '💡'
}

export default function RecommendationsPanel({ result, applied, onApply, applying }: Props) {
  const { predicted: p, recommended: r } = result

  return (
    <div className="bg-slate-800 rounded-xl p-5 space-y-4 border border-slate-700">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="text-green-400">💡</span> AI Recommendations
        </h2>
        <span className="text-xs text-slate-400">{result.recommendations.length} actions</span>
      </div>

      <div className="space-y-2">
        {result.recommendations.map((rec, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
            applied ? 'bg-green-900/20 border-green-700/50' : 'bg-slate-700/40 border-slate-600/50'
          }`}>
            <span className="text-lg flex-shrink-0 mt-0.5">{getIcon(rec)}</span>
            <p className="text-sm text-slate-200 leading-relaxed flex-1">{rec}</p>
            {applied && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
          </div>
        ))}
      </div>

      {/* Apply button */}
      {!applied ? (
        <button onClick={onApply} disabled={applying}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-green-900/40 text-sm">
          {applying ? '⏳ Applying...' : '✅ APPLY ALL RECOMMENDATIONS'}
        </button>
      ) : (
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-600 rounded-xl p-4 space-y-3">
          <p className="text-green-400 font-bold text-sm">✅ All Recommendations Applied — Projected Impact:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Congestion', before: p.congestion, after: r.congestion, unit: '%', lower: true },
              { label: 'Avg Speed', before: p.avg_speed, after: r.avg_speed, unit: 'km/h', lower: false },
              { label: 'Bus Delay', before: p.bus_delay, after: r.bus_delay, unit: 'm', lower: true },
              { label: 'Emergency', before: p.emergency_accessibility, after: r.emergency_accessibility, unit: '%', lower: false },
            ].map(({ label, before, after, unit, lower }) => {
              const improved = lower ? after < before : after > before
              const delta = after - before
              return (
                <div key={label} className="bg-slate-800/60 rounded-lg p-2 text-center">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-xs">
                    <span className="text-red-400 font-bold">{before.toFixed(1)}{unit}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className={`font-bold ${improved ? 'text-green-400' : 'text-yellow-400'}`}>{after.toFixed(1)}{unit}</span>
                  </p>
                  <p className={`text-xs mt-0.5 ${improved ? 'text-green-500' : 'text-yellow-500'}`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 text-center">
            ⚠ Projected improvement based on intervention model — actual results depend on real-world implementation
          </p>
        </div>
      )}
    </div>
  )
}
