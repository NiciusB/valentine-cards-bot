const express = require('express')
const path = require('path')
const mongoose = require('mongoose')

const app = express()

var mongooseConnectWithRetry = function() {
  mongoose.connect('mongodb://localhostd/valentinecards', {
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
  }, function(err) {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
      setTimeout(mongooseConnectWithRetry, 5000);
    }
  });
};
mongooseConnectWithRetry();

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  const port = process.env.port || 3000
  app.listen(port, () => console.log(`Valentine Cards Bot listening on http://localhost:${port}`))
  require('./cron')()
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/', express.static('public'))
app.use('/uploads', express.static('uploads'))

app.use(function(req, res, next){
  req.userIP = req.headers['cf-connecting-ip'] || req.connection.remoteAddress
  next()
})

app.use('/', require('./controllers'))

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});
