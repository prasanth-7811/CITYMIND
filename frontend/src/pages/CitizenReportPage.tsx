import { useState } from 'react'
import { createReport } from '../api/client'

interface Props {
  onReportSubmitted: () => void
}

const CATEGORIES = ['Traffic', 'Pothole', 'Garbage', 'Water', 'Streetlight', 'Bus Issue']
const SEVERITY_LABELS = ['', 'Minor', 'Low', 'Moderate', 'High', 'Critical']

export default function CitizenReportPage({ onReportSubmitted }: Props) {
  const [form, setForm] = useState({
    category: 'Traffic',
    location: '',
    lat: '',
    lon: '',
    severity: 3,
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.location || !form.description) {
      setError('Location and description are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createReport({
        ...form,
        lat: form.lat ? parseFloat(form.lat) : null,
        lon: form.lon ? parseFloat(form.lon) : null,
      })
      setSuccess(true)
      setForm({ category: 'Traffic', location: '', lat: '', lon: '', severity: 3, description: '' })
      onReportSubmitted()
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-slate-800 rounded-xl p-6 space-y-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">📝</span> Submit Citizen Report
        </h2>

        {success && (
          <div className="bg-green-900/40 border border-green-600 rounded-lg p-3 text-green-300 text-sm">
            ✅ Report submitted successfully! It will appear on the map shortly.
          </div>
        )}
        {error && (
          <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Category</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    form.category === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Location *</label>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Main Road A near Central Station"
              className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Latitude (optional)</label>
              <input
                type="number" step="any"
                value={form.lat}
                onChange={e => set('lat', e.target.value)}
                placeholder="51.505"
                className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide">Longitude (optional)</label>
              <input
                type="number" step="any"
                value={form.lon}
                onChange={e => set('lon', e.target.value)}
                placeholder="-0.090"
                className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">
              Severity: <span className="text-white font-semibold">{SEVERITY_LABELS[form.severity]}</span>
            </label>
            <input
              type="range" min={1} max={5} step={1}
              value={form.severity}
              onChange={e => set('severity', Number(e.target.value))}
              className="w-full mt-2 accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Minor</span><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full mt-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Submitting...' : '📤 Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
