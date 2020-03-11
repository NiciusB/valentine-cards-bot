require('dotenv').config()
const express = require('express')
const path = require('path')
const { onDbReady } = require('./db')

const app = express()

onDbReady(() => {
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`Valentine Cards Bot listening on http://localhost:${port}`))
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use(function (req, res, next) {
  req.userIP = req.headers['cf-connecting-ip'] || req.connection.remoteAddress
  next()
})

app.use('/', require('./controllers'))

app.use(function (req, res, next) {
  res.status(404)

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url })
    return
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' })
    return
  }

  // default to plain-text. send()
  res.type('txt').send('Not found')
})
