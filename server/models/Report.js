const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Traffic', 'Pothole', 'Garbage', 'Water', 'Streetlight', 'Bus Issue'],
      message: '{VALUE} is not a valid category'
    }
  },
  location:    { type: String, required: [true, 'Location is required'], trim: true },
  lat:         { type: Number, default: null },
  lon:         { type: Number, default: null },
  severity:    { type: Number, required: true, min: [1, 'Min 1'], max: [5, 'Max 5'] },
  description: { type: String, required: [true, 'Description is required'], trim: true },
  status:      { type: String, enum: ['open', 'resolved'], default: 'open' },
  confidence:  { type: Number, default: 0.5, min: 0, max: 1 },
}, { timestamps: true })

module.exports = mongoose.model('Report', ReportSchema)
