import { DashboardData } from '../types'

interface Props {
  data: DashboardData | null
}

function StatCard({ label, value, unit, color, icon }: {
  label: string; value: string | number; unit?: string; color: string; icon: string
}) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-white mt-1">
            {value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
        <span className="text-3xl opacity-60">{icon}</span>
      </div>
    </div>
  )
}

export default function DashboardStats({ data }: Props) {
  if (!data) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array(6).fill(0).map((_, i) => (
        <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse h-20" />
      ))}
    </div>
  )

  const congColor = data.congestion_risk > 70 ? 'border-red-500' : data.congestion_risk > 40 ? 'border-yellow-500' : 'border-green-500'
  const emergColor = data.emergency_route_risk > 70 ? 'border-green-500' : data.emergency_route_risk > 40 ? 'border-yellow-500' : 'border-red-500'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Congestion Risk" value={data.congestion_risk.toFixed(0)} unit="%" color={congColor} icon="🚦" />
      <StatCard label="Active Issues" value={data.active_issues} color="border-orange-500" icon="⚠️" />
      <StatCard label="Citizen Reports" value={data.citizen_reports} color="border-blue-500" icon="📝" />
      <StatCard label="Affected Pop." value={(data.affected_population / 1000).toFixed(0)} unit="K" color="border-purple-500" icon="👥" />
      <StatCard label="Emergency Access" value={data.emergency_route_risk.toFixed(0)} unit="%" color={emergColor} icon="🏥" />
      <StatCard label="Avg Speed" value={data.avg_speed.toFixed(0)} unit="km/h" color="border-cyan-500" icon="⚡" />
    </div>
  )
}
