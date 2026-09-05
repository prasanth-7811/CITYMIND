import { useState, useEffect, useCallback } from 'react'
import { getDashboard, getCityMap, getRoads, runSimulation, applyRecommendation } from './api/client'
import { DashboardData, CityMapData, SimulationResult, SimulateRequest } from './types'
import DashboardStats from './components/DashboardStats'
import CityMap from './components/CityMap'
import SimulatorPanel from './components/SimulatorPanel'
import SimulationResults from './components/SimulationResults'
import ExplainabilityPanel from './components/ExplainabilityPanel'
import RecommendationsPanel from './components/RecommendationsPanel'
import CitizenReportPage from './pages/CitizenReportPage'

type Tab = 'dashboard' | 'reports'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [mapData, setMapData] = useState<CityMapData | null>(null)
  const [roads, setRoads] = useState<{ id: string; name: string }[]>([])
  const [simResult, setSimResult] = useState<SimulationResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [rightPanel, setRightPanel] = useState<'simulator' | 'results' | 'explain' | 'recs'>('simulator')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [dash, city, roadList] = await Promise.all([getDashboard(), getCityMap(), getRoads()])
      setDashboard(dash)
      setMapData(city)
      setRoads(roadList)
    } catch {
      setError('Cannot connect to backend. Make sure the FastAPI server is running on port 8000.')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSimulate = async (req: SimulateRequest) => {
    setSimLoading(true)
    setApplied(false)
    setError('')
    try {
      const result = await runSimulation(req)
      setSimResult(result)
      setRightPanel('results')
      // Refresh map data to reflect simulation state
      const city = await getCityMap()
      setMapData(city)
    } catch {
      setError('Simulation failed. Check backend logs.')
    } finally {
      setSimLoading(false)
    }
  }

  const handleApply = async () => {
    if (!simResult) return
    setApplying(true)
    try {
      await applyRecommendation(simResult.simulation_id)
      setApplied(true)
      setRightPanel('recs')
      const dash = await getDashboard()
      setDashboard(dash)
    } catch {
      setError('Failed to apply recommendation.')
    } finally {
      setApplying(false)
    }
  }

  const navBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )

  const panelTab = (key: typeof rightPanel, label: string, disabled = false) => (
    <button
      onClick={() => !disabled && setRightPanel(key)}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        rightPanel === key
          ? 'bg-slate-600 text-white'
          : disabled
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Nav */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">C</div>
          <span className="text-xl font-black text-white tracking-tight">CITY<span className="text-blue-400">MIND</span></span>
          <span className="text-xs text-slate-500 ml-2 hidden md:block">AI-Powered Urban Intelligence Platform</span>
        </div>
        <nav className="flex items-center gap-1">
          {navBtn('🏙️ Dashboard', tab === 'dashboard', () => setTab('dashboard'))}
          {navBtn('📝 Report Issue', tab === 'reports', () => setTab('reports'))}
        </nav>
      </header>

      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-2 text-red-300 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {tab === 'reports' ? (
        <main className="p-6">
          <CitizenReportPage onReportSubmitted={loadData} />
        </main>
      ) : (
        <main className="p-4 space-y-4">
          {/* Stats Bar */}
          <DashboardStats data={dashboard} />

          {/* Main Content: Map + Right Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}>

            {/* Map — takes 2/3 */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ minHeight: 480 }}>
              <CityMap mapData={mapData} simResult={simResult} />
            </div>

            {/* Right Panel — takes 1/3 */}
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>

              {/* Panel tab switcher */}
              <div className="bg-slate-800 rounded-xl p-2 flex gap-1 flex-wrap">
                {panelTab('simulator', '⚡ Simulator')}
                {panelTab('results', '📊 Results', !simResult)}
                {panelTab('explain', '🧠 Explain', !simResult)}
                {panelTab('recs', '💡 Recs', !simResult)}
              </div>

              {/* Panel content */}
              {rightPanel === 'simulator' && (
                <SimulatorPanel
                  roads={roads}
                  onSimulate={handleSimulate}
                  loading={simLoading}
                />
              )}

              {rightPanel === 'results' && simResult && (
                <SimulationResults
                  result={simResult}
                  applied={applied}
                  onApply={handleApply}
                  applying={applying}
                />
              )}

              {rightPanel === 'explain' && simResult && (
                <ExplainabilityPanel result={simResult} />
              )}

              {rightPanel === 'recs' && simResult && (
                <RecommendationsPanel
                  result={simResult}
                  applied={applied}
                  onApply={handleApply}
                  applying={applying}
                />
              )}
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-slate-800 rounded-xl px-5 py-3 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Map Legend:</span>
            <span className="flex items-center gap-1.5"><span className="w-6 h-1.5 rounded bg-green-500 inline-block"/>Low Traffic</span>
            <span className="flex items-center gap-1.5"><span className="w-6 h-1.5 rounded bg-yellow-500 inline-block"/>Medium Traffic</span>
            <span className="flex items-center gap-1.5"><span className="w-6 h-1.5 rounded bg-red-500 inline-block"/>High Congestion</span>
            <span className="flex items-center gap-1.5"><span className="w-6 h-1.5 rounded bg-gray-500 border border-dashed inline-block"/>Closed Road</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>Hospital</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block"/>Stadium</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"/>Event Zone</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>Citizen Report</span>
          </div>
        </main>
      )}
    </div>
  )
}
