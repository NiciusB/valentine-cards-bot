const express = require('express')
const Card = require('../models/Card')
const Queue = require('../models/Queue')
const Stat = require('../models/Stat')
const router = express.Router()

router.get('/', async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 0
  const cat = req.query.cat || ''
  const perPage = 50
  const query = {published: true}
  if (cat) query.categories = cat
  cards = await Card.find(query).sort({timestamp: -1}).limit(perPage).skip(page * perPage).exec()
  res.render('index', { tab: 'index', cards, cat, page })
})

router.get('/send', async function (req, res) {
  const card = parseInt(req.query.card)
  const username = req.query.username

  if (!card) return res.json({error: true, message: 'Card ID not valid'})
  if (!username) return res.json({error: true, message: 'Username not valid'})

  new Queue({
    card,
    username
  }).save()

  new Stat({
    card
  }).save()

  res.json({success: true, message: 'Card sent! (It may take a while to be actually sent by the bot)'})
})

router.get('/about', async function (req, res) {
  res.render('about', { tab: 'about' })
})

router.get('/categories', async function (req, res) {
  var cards = await Card.find({published: true}).exec()
  cards = cards.map(card => card.categories).filter(categories => categories.length > 0).reduce((a, b) => a.concat(b), [])
  var categories = []
  cards.forEach(cat => {
    var catIndex = categories.findIndex(val => val.name === cat)
    if (catIndex != -1) categories[catIndex].count++
    else categories.push({name: cat, count: 1})
  })
  categories = categories.sort((a, b) => a.count < b.count ? 1 : -1)
  res.render('categories', { tab: 'categories', categories })
})

module.exports = router
