const mongoose = require('mongoose')

var schema = mongoose.Schema({
  id: Number,
  format: String,
  hash: String,
  timestamp: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  published: {
    type: Boolean,
    default: false
  },
  categories: [String],
  votes: [{
    accepted: Boolean,
    ip: String,
    timestamp: { type: Number, default: () => Math.floor(Date.now() / 1000) }
  }]
})

schema.index({ id: 1 })
schema.index({ published: 1 })
schema.index({ hash: 'text' })

var model = mongoose.model('Card', schema)

module.exports = model
