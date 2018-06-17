const express = require('express')
const path = require('path')
const mongoose = require('mongoose')

const app = express()
mongoose.connect('mongodb://localhost/valentinecards');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  const port = process.env.port || 3000
  app.listen(port, () => console.log(`Valentine Cards Bot listening on http://localhost:${port}`))
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/', express.static('public'))

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
