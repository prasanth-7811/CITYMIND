import { SimulationResult } from '../types'

interface Props {
  result: SimulationResult
  applied: boolean
  onApply: () => void
  applying: boolean
}

const REC_ICONS: Record<string, string> = {
  Redirect: '🔀',
  Add: '🚌',
  Preserve: '🏥',
  Notify: '📢',
  Reduce: '🚦',
  Deploy: '👮',
  Coordinate: '🤝',
  Issue: '⚠️',
  Monitor: '👁️',
  Activate: '⚡',
}

function getIcon(text: string): string {
  for (const [key, icon] of Object.entries(REC_ICONS)) {
    if (text.startsWith(key)) return icon
  }
  return '💡'
}

export default function RecommendationsPanel({ result, applied, onApply, applying }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="text-green-400">💡</span> AI Recommendations
      </h2>

      <div className="space-y-2">
        {result.recommendations.map((rec, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
              applied
                ? 'bg-green-900/20 border-green-700/50'
                : 'bg-slate-700/50 border-slate-600/50'
            }`}
          >
            <span className="text-lg flex-shrink-0">{getIcon(rec)}</span>
            <p className="text-sm text-slate-200 leading-relaxed">{rec}</p>
            {applied && <span className="text-green-400 text-xs flex-shrink-0 mt-0.5">✓</span>}
          </div>
        ))}
      </div>

      {applied && (
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-600 rounded-xl p-4">
          <p className="text-green-400 font-bold text-sm mb-2">✅ Recommendations Applied — Impact:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center">
              <p className="text-slate-400 text-xs">Congestion</p>
              <p className="font-bold">
                <span className="text-red-400">{result.predicted.congestion}%</span>
                {' → '}
                <span className="text-green-400">{result.recommended.congestion}%</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Avg Speed</p>
              <p className="font-bold">
                <span className="text-red-400">{result.predicted.avg_speed}</span>
                {' → '}
                <span className="text-green-400">{result.recommended.avg_speed} km/h</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Bus Delay</p>
              <p className="font-bold">
                <span className="text-red-400">{result.predicted.bus_delay.toFixed(1)}m</span>
                {' → '}
                <span className="text-green-400">{result.recommended.bus_delay.toFixed(1)}m</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Emergency</p>
              <p className="font-bold">
                <span className="text-red-400">{result.predicted.emergency_accessibility.toFixed(0)}%</span>
                {' → '}
                <span className="text-green-400">{result.recommended.emergency_accessibility.toFixed(0)}%</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {!applied && (
        <button
          onClick={onApply}
          disabled={applying}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all"
        >
          {applying ? 'Applying...' : '✅ APPLY RECOMMENDATION'}
        </button>
      )}
    </div>
  )
}
