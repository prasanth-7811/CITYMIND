import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { CityMapData, SimulationResult } from '../types'

interface Props {
  mapData: CityMapData | null
  simResult: SimulationResult | null
}

const CONGESTION_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
}

const ZONE_COLORS: Record<string, string> = {
  hospital: '#f43f5e',
  stadium: '#8b5cf6',
  commercial: '#f97316',
  education: '#06b6d4',
  business: '#3b82f6',
}

const REPORT_COLORS: Record<string, string> = {
  Traffic: '#ef4444',
  Pothole: '#f97316',
  Garbage: '#84cc16',
  Water: '#06b6d4',
  Streetlight: '#eab308',
  'Bus Issue': '#8b5cf6',
}

export default function CityMap({ mapData, simResult }: Props) {
  if (!mapData) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-xl">
      <p className="text-slate-400">Loading map...</p>
    </div>
  )

  // Build affected road set from simulation
  const affectedRoadNames = new Set(simResult?.affected_roads.map(r => r.road) ?? [])
  const closedRoad = simResult?.road

  const getRoadColor = (road: CityMapData['roads'][0]) => {
    if (simResult) {
      if (road.name === closedRoad) return '#6b7280'
      if (affectedRoadNames.has(road.name)) return '#ef4444'
    }
    return CONGESTION_COLORS[road.congestion_level] ?? '#22c55e'
  }

  const getRoadWeight = (road: CityMapData['roads'][0]) => {
    if (simResult && (road.name === closedRoad || affectedRoadNames.has(road.name))) return 5
    return 3
  }

  return (
    <MapContainer
      center={[11.0168, 76.9758]}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Roads */}
      {mapData.roads.map(road => (
        <Polyline
          key={road.id}
          positions={road.coords}
          color={getRoadColor(road)}
          weight={getRoadWeight(road)}
          opacity={road.name === closedRoad ? 0.4 : 0.85}
          dashArray={road.name === closedRoad ? '8 6' : undefined}
        >
          <Tooltip sticky>
            <div className="text-xs">
              <strong>{road.name}</strong><br />
              Utilization: {Math.round(road.utilization * 100)}%<br />
              Speed: {road.avg_speed} km/h<br />
              Status: {road.status}
              {road.name === closedRoad && <><br /><span className="text-red-500">⚠ CLOSED</span></>}
            </div>
          </Tooltip>
        </Polyline>
      ))}

      {/* Nodes / Intersections */}
      {mapData.nodes.map(node => (
        <CircleMarker
          key={node.id}
          center={[node.lat, node.lon]}
          radius={node.type === 'hub' ? 7 : node.type === 'hospital' ? 8 : 4}
          color={node.type === 'hospital' ? '#f43f5e' : node.type === 'hub' ? '#3b82f6' : '#64748b'}
          fillColor={node.type === 'hospital' ? '#f43f5e' : node.type === 'hub' ? '#3b82f6' : '#475569'}
          fillOpacity={0.9}
          weight={2}
        >
          <Popup>
            <strong>{node.name}</strong><br />
            Type: {node.type}<br />
            Population: {node.population.toLocaleString()}
          </Popup>
        </CircleMarker>
      ))}

      {/* Zones */}
      {mapData.zones.map(zone => (
        <CircleMarker
          key={zone.id}
          center={[zone.lat, zone.lon]}
          radius={10}
          color={ZONE_COLORS[zone.type] ?? '#94a3b8'}
          fillColor={ZONE_COLORS[zone.type] ?? '#94a3b8'}
          fillOpacity={0.3}
          weight={2}
        >
          <Popup>
            <strong>{zone.name}</strong><br />
            Type: {zone.type}<br />
            Population: {zone.population.toLocaleString()}
          </Popup>
        </CircleMarker>
      ))}

      {/* Events */}
      {mapData.events.filter(e => e.active).map(event => (
        <CircleMarker
          key={event.id}
          center={[event.lat, event.lon]}
          radius={12}
          color="#f59e0b"
          fillColor="#f59e0b"
          fillOpacity={0.25}
          weight={2}
          dashArray="4 3"
        >
          <Popup>
            <strong>🎉 {event.name}</strong><br />
            Attendance: {event.size.toLocaleString()}
          </Popup>
        </CircleMarker>
      ))}

      {/* Citizen Reports */}
      {mapData.reports.map(report => (
        <CircleMarker
          key={report.id}
          center={[report.lat!, report.lon!]}
          radius={5 + report.severity}
          color={REPORT_COLORS[report.category] ?? '#94a3b8'}
          fillColor={REPORT_COLORS[report.category] ?? '#94a3b8'}
          fillOpacity={0.7}
          weight={1}
        >
          <Popup>
            <strong>{report.category}</strong><br />
            {report.location}<br />
            Severity: {report.severity}/5<br />
            {report.description}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
