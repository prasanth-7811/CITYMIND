import { DashboardData } from '../types'

interface Props { data: DashboardData | null }

function StatCard({ label, value, unit, color, icon, sub }: {
  label: string; value: string | number; unit?: string
  color: string; icon: string; sub?: string
}) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 border-l-4 ${color} border border-slate-700`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-black text-white mt-0.5">
            {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
          {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
        </div>
        <span className="text-2xl opacity-50 ml-2">{icon}</span>
      </div>
    </div>
  )
}

export default function DashboardStats({ data }: Props) {
  if (!data) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-24 border border-slate-700" />
      ))}
    </div>
  )

  const congColor = data.congestion_risk > 70 ? 'border-red-500' : data.congestion_risk > 40 ? 'border-yellow-500' : 'border-green-500'
  const emergColor = data.emergency_route_risk > 70 ? 'border-green-500' : data.emergency_route_risk > 40 ? 'border-yellow-500' : 'border-red-500'
  const topRoad = data.top_congested_roads?.[0]

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Congestion Risk" value={data.congestion_risk.toFixed(0)} unit="%" color={congColor} icon="🚦"
          sub={topRoad ? `Worst: ${topRoad.name}` : undefined} />
        <StatCard label="Active Issues" value={data.active_issues} color="border-orange-500" icon="⚠️"
          sub={`${data.citizen_reports} total reports`} />
        <StatCard label="Citizen Reports" value={data.citizen_reports} color="border-blue-500" icon="📝"
          sub={data.hotspots?.length ? `${data.hotspots.length} hotspot(s)` : 'No hotspots'} />
        <StatCard label="Affected Pop." value={(data.affected_population / 1000).toFixed(0)} unit="K" color="border-purple-500" icon="👥"
          sub="Coimbatore city" />
        <StatCard label="Emergency Access" value={data.emergency_route_risk.toFixed(0)} unit="%" color={emergColor} icon="🏥"
          sub="GKNM Hospital route" />
        <StatCard label="Avg Speed" value={data.avg_speed.toFixed(0)} unit="km/h" color="border-cyan-500" icon="⚡"
          sub={`${data.open_roads}/${data.total_roads} roads open`} />
      </div>

      {/* Top congested roads strip */}
      {data.top_congested_roads && data.top_congested_roads.length > 0 && (
        <div className="bg-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 border border-slate-700 overflow-x-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap font-semibold">Top Congested:</span>
          {data.top_congested_roads.map((r, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              r.utilization > 70 ? 'bg-red-900/50 text-red-300 border border-red-700' :
              r.utilization > 40 ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
              'bg-green-900/50 text-green-300 border border-green-700'}`}>
              {r.name} — {r.utilization}%
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
