const mongoose = require('mongoose')

const mongooseConnectWithRetry = function () {
  mongoose.connect('mongodb://localhost:27017/valentinecards', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, function (err) {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err)
      setTimeout(mongooseConnectWithRetry, 5000)
    }
  })
}
mongooseConnectWithRetry()

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))

module.exports.onDbReady = callback => {
  db.once('open', function () {
    callback()
    require('./cron')()
  })
}
