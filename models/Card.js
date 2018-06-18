const mongoose = require('mongoose')

var schema = mongoose.Schema({
  id: Number,
  format: String,
  timestamp: { type: Number, default: () => Math.floor(Date.now()/1000) },
  published: Boolean,
  categories: [String],
  votes: [{
    accepted: Boolean,
    ip: String,
    timestamp: { type: Number, default: () => Math.floor(Date.now()/1000) },
  }]
});

schema.index({'published': 1})
schema.index({'id': 1})

var model = mongoose.model('Card', schema);

module.exports = model
