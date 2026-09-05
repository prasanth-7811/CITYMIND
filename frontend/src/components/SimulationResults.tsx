import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { SimulationResult, Metrics } from '../types'

interface Props {
  result: SimulationResult
  applied: boolean
  onApply: () => void
  applying: boolean
}

const MetricCard = ({ label, before, after, recommended, unit = '', lowerBetter = true }: {
  label: string; before: number; after: number; recommended: number; unit?: string; lowerBetter?: boolean
}) => {
  const worse = lowerBetter ? after > before : after < before
  const improved = lowerBetter ? recommended < after : recommended > after
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <div className="text-center">
          <p className="text-xs text-slate-500">Before</p>
          <p className="text-sm font-bold text-slate-300">{before}{unit}</p>
        </div>
        <span className="text-slate-500 mb-0.5">→</span>
        <div className="text-center">
          <p className="text-xs text-slate-500">After</p>
          <p className={`text-sm font-bold ${worse ? 'text-red-400' : 'text-green-400'}`}>{after}{unit}</p>
        </div>
        <span className="text-slate-500 mb-0.5">→</span>
        <div className="text-center">
          <p className="text-xs text-blue-400">+AI</p>
          <p className={`text-sm font-bold ${improved ? 'text-green-400' : 'text-yellow-400'}`}>{recommended}{unit}</p>
        </div>
      </div>
    </div>
  )
}

export default function SimulationResults({ result, applied, onApply, applying }: Props) {
  const { baseline: b, predicted: p, recommended: r } = result

  const chartData = [
    { name: 'Congestion', before: b.congestion, after: p.congestion, recommended: r.congestion },
    { name: 'Avg Speed', before: b.avg_speed, after: p.avg_speed, recommended: r.avg_speed },
    { name: 'Bus Delay', before: b.bus_delay, after: p.bus_delay, recommended: r.bus_delay },
    { name: 'Emergency %', before: b.emergency_accessibility, after: p.emergency_accessibility, recommended: r.emergency_accessibility },
  ]

  const impactColor = result.emergency_impact === 'HIGH' ? 'text-red-400' :
    result.emergency_impact === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-white">{result.scenario}: {result.road}</h3>
            <p className="text-xs text-slate-400">Simulation #{result.simulation_id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Risk Score</p>
            <p className={`text-2xl font-black ${result.risk_score > 70 ? 'text-red-400' : result.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
              {result.risk_score}%
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className={`font-semibold ${impactColor}`}>Emergency: {result.emergency_impact}</span>
          <span className="text-slate-400">Citizens affected: <span className="text-white font-semibold">{result.citizens_affected.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Metrics: Before → After → +AI Recommendation</p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Congestion %" before={b.congestion} after={p.congestion} recommended={r.congestion} unit="%" />
          <MetricCard label="Avg Speed km/h" before={b.avg_speed} after={p.avg_speed} recommended={r.avg_speed} unit="" lowerBetter={false} />
          <MetricCard label="Travel Time min" before={b.travel_time} after={p.travel_time} recommended={r.travel_time} unit="m" />
          <MetricCard label="Bus Delay min" before={b.bus_delay} after={p.bus_delay} recommended={r.bus_delay} unit="m" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Impact Chart</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={14}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Bar dataKey="before" fill="#475569" name="Before" radius={[3,3,0,0]} />
            <Bar dataKey="after" fill="#ef4444" name="After" radius={[3,3,0,0]} />
            <Bar dataKey="recommended" fill="#22c55e" name="+AI" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-500 inline-block"/>Before</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block"/>After</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>+AI</span>
        </div>
      </div>

      {/* Affected Roads */}
      {result.affected_roads.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Affected Roads</p>
          <div className="space-y-1">
            {result.affected_roads.map((ar, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{ar.road}</span>
                <span className="text-red-400 font-semibold">+{ar.traffic_increase.toFixed(0)}% traffic</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Recommendation CTA */}
      {!applied && (
        <button
          onClick={onApply}
          disabled={applying}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-green-900/40"
        >
          {applying ? 'Applying...' : '✅ APPLY RECOMMENDATION'}
        </button>
      )}

      {applied && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
          <p className="text-green-400 font-bold">✅ Recommendation Applied</p>
          <p className="text-sm text-slate-300 mt-1">
            Congestion: <span className="text-red-400 font-bold">{p.congestion}%</span>
            {' → '}
            <span className="text-green-400 font-bold">{r.congestion}%</span>
          </p>
        </div>
      )}
    </div>
  )
}
