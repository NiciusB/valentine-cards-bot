const mongoose = require('mongoose')

var schema = mongoose.Schema({
  card: Number,
  username: String,
  timestamp: { type: Number, default: () => Math.floor(Date.now() / 1000) }
})

var model = mongoose.model('Queue', schema)

module.exports = model
