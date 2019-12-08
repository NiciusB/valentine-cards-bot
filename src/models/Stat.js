const mongoose = require('mongoose')

var schema = mongoose.Schema({
  card: Number,
  timestamp: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

var model = mongoose.model('Stat', schema)

module.exports = model
