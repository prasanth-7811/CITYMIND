export interface DashboardData {
  congestion_risk: number
  active_issues: number
  citizen_reports: number
  affected_population: number
  emergency_route_risk: number
  active_events: number
  avg_speed: number
  total_roads: number
  open_roads: number
  top_congested_roads: { name: string; utilization: number }[]
  hotspots: Hotspot[]
  data_source: string
  last_updated: string
}

export interface Hotspot {
  location: string
  lat: number
  lon: number
  report_count: number
  categories: string[]
  avg_severity: number
  confidence: number
}

export interface RoadData {
  id: string
  name: string
  source: string
  dest: string
  capacity: number
  traffic_volume: number
  avg_speed: number
  length: number
  status: string
  utilization: number
  congestion_level: 'low' | 'medium' | 'high'
  coords: [[number, number], [number, number]]
}

export interface NodeData {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  population: number
}

export interface ZoneData {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  population: number
}

export interface ReportData {
  id: number
  category: string
  location: string
  lat: number | null
  lon: number | null
  severity: number
  description: string
  confidence: number
  status: string
}

export interface EventData {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  size: number
  active: boolean
}

export interface CityMapData {
  roads: RoadData[]
  nodes: NodeData[]
  zones: ZoneData[]
  reports: ReportData[]
  events: EventData[]
}

export interface Metrics {
  congestion: number
  avg_speed: number
  travel_time: number
  bus_delay: number
  emergency_accessibility: number
  citizens_affected: number
}

export interface AffectedRoad {
  road: string
  road_id: string
  traffic_increase: number
  severity: 'low' | 'medium' | 'high'
}

export interface SimulationResult {
  simulation_id: number
  scenario: string
  road: string
  risk_score: number
  ml_congestion?: number
  prediction_method?: string
  baseline: Metrics
  predicted: Metrics
  recommended: Metrics
  affected_roads: AffectedRoad[]
  emergency_impact: string
  emergency_detail?: {
    before: { score: number; accessible_nodes: number; blocked_nodes: number }
    after: { score: number; accessible_nodes: number; blocked_nodes: number }
  }
  citizens_affected: number
  explanation: { factor: string; impact: number; importance?: number }[]
  explanation_summary?: string
  recommendations: string[]
  context: Record<string, any>
  network_stats?: {
    baseline: Record<string, any>
    post_scenario: Record<string, any>
  }
}

export interface SimulateRequest {
  scenario_type: string
  road_id?: string
  start_time: string
  duration: number
  weather: string
  event_size: number
  traffic_condition: string
}
