import { useState } from 'react'
import { SimulateRequest } from '../types'

interface Props {
  roads: { id: string; name: string }[]
  onSimulate: (req: SimulateRequest) => void
  loading: boolean
}

export default function SimulatorPanel({ roads, onSimulate, loading }: Props) {
  const [form, setForm] = useState<SimulateRequest>({
    scenario_type: 'road_closure',
    road_id: roads[0]?.id ?? '',
    start_time: '08:00',
    duration: 2,
    weather: 'clear',
    event_size: 0,
    traffic_condition: 'normal',
  })

  const set = (k: keyof SimulateRequest, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-slate-800 rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="text-blue-400">⚡</span> What-If Simulator
      </h2>

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide">Scenario Type</label>
        <select
          className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
          value={form.scenario_type}
          onChange={e => set('scenario_type', e.target.value)}
        >
          <option value="road_closure">Close Road</option>
          <option value="add_bus_route">Add Bus Route</option>
          <option value="large_event">Large Event</option>
          <option value="road_maintenance">Road Maintenance</option>
        </select>
      </div>

      {(form.scenario_type === 'road_closure' || form.scenario_type === 'road_maintenance') && (
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">Select Road</label>
          <select
            className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
            value={form.road_id}
            onChange={e => set('road_id', e.target.value)}
          >
            {roads.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {(form.scenario_type === 'large_event' || form.scenario_type === 'add_bus_route') && (
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">
            Event Size: {form.event_size.toLocaleString()}
          </label>
          <input
            type="range" min={0} max={50000} step={1000}
            value={form.event_size}
            onChange={e => set('event_size', Number(e.target.value))}
            className="w-full mt-1 accent-blue-500"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">Start Time</label>
          <input
            type="time"
            value={form.start_time}
            onChange={e => set('start_time', e.target.value)}
            className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide">Duration (hrs)</label>
          <input
            type="number" min={0.5} max={24} step={0.5}
            value={form.duration}
            onChange={e => set('duration', Number(e.target.value))}
            className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide">Weather</label>
        <select
          className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
          value={form.weather}
          onChange={e => set('weather', e.target.value)}
        >
          <option value="clear">☀️ Clear</option>
          <option value="cloudy">☁️ Cloudy</option>
          <option value="light_rain">🌦 Light Rain</option>
          <option value="heavy_rain">🌧 Heavy Rain</option>
          <option value="fog">🌫 Fog</option>
          <option value="snow">❄️ Snow</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide">Traffic Condition</label>
        <select
          className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
          value={form.traffic_condition}
          onChange={e => set('traffic_condition', e.target.value)}
        >
          <option value="light">🟢 Light</option>
          <option value="normal">🟡 Normal</option>
          <option value="heavy">🟠 Heavy</option>
          <option value="gridlock">🔴 Gridlock</option>
        </select>
      </div>

      <button
        onClick={() => onSimulate(form)}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Simulating...
          </span>
        ) : '⚡ SIMULATE'}
      </button>
    </div>
  )
}
