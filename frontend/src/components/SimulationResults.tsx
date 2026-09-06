import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SimulationResult } from '../types'

interface Props {
  result: SimulationResult
  applied: boolean
  onApply: () => void
  applying: boolean
}

function MetricRow({ label, before, after, recommended, unit = '', lowerBetter = true }: {
  label: string; before: number; after: number; recommended: number
  unit?: string; lowerBetter?: boolean
}) {
  const worse = lowerBetter ? after > before : after < before
  const improved = lowerBetter ? recommended < after : recommended > after
  const delta = after - before
  const deltaStr = (delta > 0 ? '+' : '') + delta.toFixed(1)
  return (
    <div className="grid grid-cols-4 gap-2 items-center py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-300 text-center">{before}{unit}</span>
      <div className="text-center">
        <span className={`text-sm font-bold ${worse ? 'text-red-400' : 'text-green-400'}`}>{after}{unit}</span>
        <span className={`text-xs ml-1 ${worse ? 'text-red-500' : 'text-green-500'}`}>({deltaStr})</span>
      </div>
      <span className={`text-sm font-bold text-center ${improved ? 'text-green-400' : 'text-yellow-400'}`}>{recommended}{unit}</span>
    </div>
  )
}

export default function SimulationResults({ result, applied, onApply, applying }: Props) {
  const { baseline: b, predicted: p, recommended: r } = result

  const chartData = [
    { name: 'Congestion%', before: b.congestion, after: p.congestion, recommended: r.congestion },
    { name: 'Speed', before: b.avg_speed, after: p.avg_speed, recommended: r.avg_speed },
    { name: 'Bus Delay', before: b.bus_delay, after: p.bus_delay, recommended: r.bus_delay },
    { name: 'Emergency%', before: b.emergency_accessibility, after: p.emergency_accessibility, recommended: r.emergency_accessibility },
  ]

  const impactColor = result.emergency_impact === 'HIGH' ? 'text-red-400 bg-red-900/30 border-red-700'
    : result.emergency_impact === 'MEDIUM' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700'
    : 'text-green-400 bg-green-900/30 border-green-700'

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-white text-base">{result.scenario}: {result.road}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Simulation #{result.simulation_id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Risk Score</p>
            <p className={`text-3xl font-black ${result.risk_score > 70 ? 'text-red-400' : result.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
              {result.risk_score}%
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${impactColor}`}>
            🏥 Emergency: {result.emergency_impact}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-slate-600 bg-slate-700 text-slate-300">
            👥 {result.citizens_affected.toLocaleString()} citizens affected
          </span>
          {result.prediction_method && (
            <span className="text-xs px-2 py-1 rounded-full border border-purple-700 bg-purple-900/30 text-purple-300">
              🤖 {result.prediction_method}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <span className="text-xs text-slate-500">Metric</span>
          <span className="text-xs text-slate-400 text-center font-semibold">BEFORE</span>
          <span className="text-xs text-red-400 text-center font-semibold">PREDICTED</span>
          <span className="text-xs text-green-400 text-center font-semibold">+AI REC</span>
        </div>
        <MetricRow label="Congestion" before={b.congestion} after={p.congestion} recommended={r.congestion} unit="%" />
        <MetricRow label="Avg Speed" before={b.avg_speed} after={p.avg_speed} recommended={r.avg_speed} unit="" lowerBetter={false} />
        <MetricRow label="Travel Time" before={b.travel_time} after={p.travel_time} recommended={r.travel_time} unit="m" />
        <MetricRow label="Bus Delay" before={b.bus_delay} after={p.bus_delay} recommended={r.bus_delay} unit="m" />
        <MetricRow label="Emergency%" before={b.emergency_accessibility} after={p.emergency_accessibility} recommended={r.emergency_accessibility} unit="%" lowerBetter={false} />
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Impact Comparison Chart</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barSize={12} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="before" fill="#475569" name="Before" radius={[3,3,0,0]} />
            <Bar dataKey="after" fill="#ef4444" name="Predicted" radius={[3,3,0,0]} />
            <Bar dataKey="recommended" fill="#22c55e" name="+AI" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-slate-500 inline-block"/>Before</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500 inline-block"/>Predicted</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-green-500 inline-block"/>+AI Rec</span>
        </div>
      </div>

      {/* Affected Roads */}
      {result.affected_roads.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Traffic Redistributed To</p>
          <div className="space-y-1.5">
            {result.affected_roads.map((ar, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-slate-300">{ar.road}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${ar.traffic_increase > 40 ? 'bg-red-500' : ar.traffic_increase > 20 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(ar.traffic_increase, 100)}%` }} />
                  </div>
                  <span className="text-red-400 font-semibold text-xs w-14 text-right">+{ar.traffic_increase.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply CTA */}
      {!applied ? (
        <button onClick={onApply} disabled={applying}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-green-900/40 text-sm">
          {applying ? '⏳ Applying Recommendations...' : '✅ APPLY AI RECOMMENDATION'}
        </button>
      ) : (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
          <p className="text-green-400 font-bold">✅ Recommendations Applied</p>
          <p className="text-sm text-slate-300 mt-1">
            Congestion: <span className="text-red-400 font-bold">{p.congestion}%</span>
            {' → '}
            <span className="text-green-400 font-bold text-lg">{r.congestion}%</span>
            <span className="text-green-500 text-xs ml-2">({(p.congestion - r.congestion).toFixed(1)}% reduction)</span>
          </p>
        </div>
      )}
    </div>
  )
}
