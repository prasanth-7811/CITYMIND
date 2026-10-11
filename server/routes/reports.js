const express = require('express')
const { body, param, validationResult } = require('express-validator')
const Report = require('../models/Report')

const router = express.Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return res.status(400).json({ error: 'Validation failed', details: errors.array() })
  next()
}

const reportRules = [
  body('category').isIn(['Traffic','Pothole','Garbage','Water','Streetlight','Bus Issue'])
    .withMessage('Invalid category'),
  body('location').notEmpty().trim().withMessage('Location is required'),
  body('severity').isInt({ min: 1, max: 5 }).withMessage('Severity must be 1–5'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('lat').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('lon').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
]

// GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 })
    res.json(reports)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports', message: err.message })
  }
})

// GET single report
router.get('/:id', param('id').isMongoId().withMessage('Invalid ID'), validate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create report
router.post('/', reportRules, validate, async (req, res) => {
  try {
    const { category, location, lat, lon, severity, description } = req.body
    const resolvedLat = lat ?? (11.0168 + (Math.abs(location.charCodeAt(0) % 100)) * 0.0002)
    const resolvedLon = lon ?? (76.9558 + (Math.abs(location.charCodeAt(0) % 100)) * 0.0002)
    const report = await Report.create({
      category, location, severity, description,
      lat: resolvedLat, lon: resolvedLon
    })
    res.status(201).json(report)
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ error: 'Validation failed', details: err.message })
    res.status(500).json({ error: err.message })
  }
})

// PUT update report
router.put('/:id',
  [param('id').isMongoId(), ...reportRules], validate,
  async (req, res) => {
    try {
      const report = await Report.findByIdAndUpdate(req.params.id, req.body, {
        new: true, runValidators: true
      })
      if (!report) return res.status(404).json({ error: 'Report not found' })
      res.json(report)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
)

// PATCH status only
router.patch('/:id/status',
  [param('id').isMongoId(), body('status').isIn(['open','resolved'])],
  validate,
  async (req, res) => {
    try {
      const report = await Report.findByIdAndUpdate(
        req.params.id, { status: req.body.status }, { new: true }
      )
      if (!report) return res.status(404).json({ error: 'Report not found' })
      res.json(report)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
)

// DELETE report
router.delete('/:id', param('id').isMongoId().withMessage('Invalid ID'), validate, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id)
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json({ message: 'Report deleted', id: req.params.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
