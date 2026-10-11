const express = require('express')
const router = express.Router()

// Proxy to Python FastAPI — keeps Node.js as the single backend entry point
const PYTHON_API = process.env.PYTHON_API || 'http://localhost:8000'

async function proxyGet(path, res) {
  try {
    const r = await fetch(`${PYTHON_API}${path}`)
    if (!r.ok) return res.status(r.status).json({ error: `Upstream error ${r.status}` })
    res.json(await r.json())
  } catch (err) {
    res.status(502).json({ error: 'Python API unreachable', message: err.message })
  }
}

async function proxyPost(path, body, res) {
  try {
    const r = await fetch(`${PYTHON_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!r.ok) {
      const detail = await r.json().catch(() => ({}))
      return res.status(r.status).json({ error: detail?.detail || `Upstream error ${r.status}` })
    }
    res.json(await r.json())
  } catch (err) {
    res.status(502).json({ error: 'Python API unreachable', message: err.message })
  }
}

router.get('/dashboard',  (req, res) => proxyGet('/api/dashboard', res))
router.get('/city',       (req, res) => proxyGet('/api/city', res))
router.get('/roads',      (req, res) => proxyGet('/api/roads', res))
router.post('/simulate',  (req, res) => proxyPost('/api/simulate', req.body, res))
router.post('/apply-recommendation', (req, res) => proxyPost('/api/apply-recommendation', req.body, res))

module.exports = router
