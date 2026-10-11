require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const reportsRouter = require('./routes/reports')
const proxyRouter   = require('./routes/proxy')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/reports', reportsRouter)   // MongoDB CRUD
app.use('/api',         proxyRouter)     // Proxy → FastAPI

app.get('/', (_req, res) => res.json({
  message: 'CityMind Node.js Server',
  version: '1.0.0',
  endpoints: {
    reports:   'GET|POST|PUT|DELETE /api/reports',
    dashboard: 'GET /api/dashboard',
    city:      'GET /api/city',
    roads:     'GET /api/roads',
    simulate:  'POST /api/simulate',
  }
}))

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

// ── MongoDB + Start ───────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(PORT, () => console.log(`🚀 Node.js server running on http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('⚠  Starting without MongoDB (reports will be unavailable)')
    app.listen(PORT, () => console.log(`🚀 Node.js server running on http://localhost:${PORT} (no DB)`))
  })
