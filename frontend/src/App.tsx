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
type RightPanel = 'simulator' | 'results' | 'explain' | 'recs'

const PIPELINE_STEPS = [
  'City State',
  'Digital Twin',
  'Risk Engine',
  'ML Predict',
  'Explain',
  'Recommend',
]

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [mapData, setMapData] = useState<CityMapData | null>(null)
  const [roads, setRoads] = useState<{ id: string; name: string }[]>([])
  const [simResult, setSimResult] = useState<SimulationResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanel>('simulator')
  const [error, setError] = useState('')
  const [clock, setClock] = useState(new Date())

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [dash, city, roadList] = await Promise.all([getDashboard(), getCityMap(), getRoads()])
      setDashboard(dash)
      setMapData(city)
      setRoads(roadList)
      setError('')
    } catch {
      setError('Cannot connect to backend. Run: python -m uvicorn backend.main:app --reload --port 8000')
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Auto-refresh dashboard every 30s
  useEffect(() => {
    const t = setInterval(loadData, 30000)
    return () => clearInterval(t)
  }, [loadData])

  const handleSimulate = async (req: SimulateRequest) => {
    setSimLoading(true)
    setApplied(false)
    setError('')
    setPipelineStep(0)
    try {
      // Animate pipeline steps
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        setPipelineStep(i)
        await new Promise(r => setTimeout(r, 300))
      }
      const result = await runSimulation(req)
      setSimResult(result)
      setRightPanel('results')
      const city = await getCityMap()
      setMapData(city)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Simulation failed. Check backend logs.')
    } finally {
      setSimLoading(false)
      setPipelineStep(-1)
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
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
      {label}
    </button>
  )

  const panelTab = (key: RightPanel, label: string, disabled = false) => (
    <button onClick={() => !disabled && setRightPanel(key)} disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${rightPanel === key
        ? 'bg-blue-600 text-white'
        : disabled ? 'text-slate-600 cursor-not-allowed'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg">C</div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">CITY<span className="text-blue-400">MIND</span></span>
            <span className="text-xs text-slate-500 ml-2 hidden md:inline">Coimbatore Urban Intelligence Platform</span>
          </div>
          <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 hidden md:inline">
            ● LIVE DEMO
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono hidden md:block">
            {clock.toLocaleTimeString('en-IN', { hour12: false })} IST
          </span>
          <nav className="flex items-center gap-1">
            {navBtn('🏙️ Dashboard', tab === 'dashboard', () => setTab('dashboard'))}
            {navBtn('📝 Report Issue', tab === 'reports', () => setTab('reports'))}
          </nav>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-900/60 border-b border-red-700 px-6 py-2 text-red-300 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-white text-lg leading-none">✕</button>
        </div>
      )}

      {/* ── Pipeline Progress (during simulation) ── */}
      {simLoading && (
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap mr-2">Running Pipeline:</span>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  i < pipelineStep ? 'bg-green-800 text-green-300' :
                  i === pipelineStep ? 'bg-blue-600 text-white animate-pulse' :
                  'bg-slate-700 text-slate-500'}`}>
                  {i < pipelineStep ? '✓ ' : ''}{step}
                </span>
                {i < PIPELINE_STEPS.length - 1 && <span className="text-slate-600">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' ? (
        <main className="p-6 flex-1">
          <CitizenReportPage onReportSubmitted={loadData} />
        </main>
      ) : (
        <main className="p-4 space-y-3 flex-1">
          {/* Stats Bar */}
          <DashboardStats data={dashboard} />

          {/* Map + Right Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>

            {/* Map */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden border border-slate-700" style={{ minHeight: 480 }}>
              <CityMap mapData={mapData} simResult={simResult} />
            </div>

            {/* Right Panel */}
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 230px)' }}>
              {/* Panel tabs */}
              <div className="bg-slate-800 rounded-xl p-2 flex gap-1 flex-wrap border border-slate-700">
                {panelTab('simulator', '⚡ Simulator')}
                {panelTab('results', '📊 Results', !simResult)}
                {panelTab('explain', '🧠 Explain', !simResult)}
                {panelTab('recs', '💡 Recs', !simResult)}
              </div>

              {rightPanel === 'simulator' && (
                <SimulatorPanel roads={roads} onSimulate={handleSimulate} loading={simLoading} />
              )}
              {rightPanel === 'results' && simResult && (
                <SimulationResults result={simResult} applied={applied} onApply={handleApply} applying={applying} />
              )}
              {rightPanel === 'explain' && simResult && (
                <ExplainabilityPanel result={simResult} />
              )}
              {rightPanel === 'recs' && simResult && (
                <RecommendationsPanel result={simResult} applied={applied} onApply={handleApply} applying={applying} />
              )}
            </div>
          </div>

          {/* Footer legend + data source */}
          <div className="bg-slate-800 rounded-xl px-5 py-2.5 flex flex-wrap items-center gap-5 text-xs text-slate-400 border border-slate-700">
            <span className="font-semibold text-slate-300">Map:</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-1.5 rounded bg-green-500 inline-block"/>Low</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-1.5 rounded bg-yellow-500 inline-block"/>Medium</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-1.5 rounded bg-red-500 inline-block"/>High</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-1.5 rounded bg-gray-500 inline-block" style={{borderTop:'2px dashed #9ca3af'}}/>Closed</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>Hospital</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 inline-block"/>Stadium/Event</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"/>Report</span>
            <span className="ml-auto text-slate-600">⚠ Synthetic demo data — not live government feed</span>
          </div>
        </main>
      )}
    </div>
  )
}
