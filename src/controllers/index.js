const express = require('express')
const fs = require('fs')
const multer = require('multer')
const upload = multer({
  storage: multer.memoryStorage()
})
const imageHash = require('node-image-hash')
const Card = require('../models/Card')
const Queue = require('../models/Queue')
const Stat = require('../models/Stat')
const router = express.Router()

router.get('/', async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 0
  const cat = req.query.cat || ''
  const perPage = 50

  var query = { published: true }
  if (cat) query.categories = cat
  if (req.query.id) query = { id: req.query.id } // Avoid requirement to be published
  const cards = await Card.find(query).sort({ timestamp: -1 }).limit(perPage).skip(page * perPage).exec()
  res.render('index', { tab: 'index', cards, cat, page })
})

router.get('/send', async function (req, res) {
  const cardID = parseInt(req.query.card)
  const username = req.query.username

  if (!cardID) return res.json({ error: true, message: 'Card ID not valid' })
  const card = await Card.findOne({ published: true, id: cardID }).exec()
  if (!card) return res.json({ error: true, message: 'Card not found' })
  if (!username) return res.json({ error: true, message: 'Username not valid' })

  new Queue({
    card: cardID,
    username
  }).save()

  new Stat({
    card: cardID
  }).save()

  res.json({ success: true, message: 'Card sent! (It may take a while to be actually sent by the bot)' })
})

router.get('/about', async function (req, res) {
  res.render('about', { tab: 'about' })
})

var cpUpload = upload.single('vCard')
router.all('/upload', cpUpload, async function (req, res) {
  const renderData = { tab: 'upload' }
  if (!req.file) {
    res.render('upload', renderData)
    return
  }

  renderData.uploaded = false
  const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
  const newCardID = (await Card.findOne().sort({ id: -1 }).exec()).id + 1
  const format = req.file.mimetype.split('/')[1]

  if (['image/jpg', 'image/jpeg', 'image/png', 'image/gif'].indexOf(req.file.mimetype) === -1) {
    renderData.error = 'Image type not recognised'
    res.render('upload', renderData)
    return
  }

  if (req.file.size > 1024 * 1024 * 7) {
    renderData.error = 'Sorry, your file is too large'
    res.render('upload', renderData)
    return
  }

  const hash = await imageHash.hash(req.file.buffer, 256).then(res => {
    return `${res.type}_${res.hash}`
  })
  const cardWithSameHash = await Card.findOne({ hash }).exec()
  if (cardWithSameHash) {
    renderData.error = `This card has already been uploaded (<a href="/?id=${cardWithSameHash.id}">View Card</a>)`
    res.render('upload', renderData)
    return
  }

  fs.access('uploads', function (err) {
    if (err) fs.mkdirSync('uploads')

    fs.writeFile(`uploads/${newCardID}.${format}`, req.file.buffer, function () {
      new Card({
        id: newCardID,
        format,
        hash,
        categories: tags,
        votes: []
      }).save(function () {
        renderData.uploaded = true
        res.render('upload', renderData)
      })
    })
  })
})

router.get('/categories', async function (req, res) {
  var cards = await Card.find({ published: true }).exec()
  cards = cards.map(card => card.categories).filter(categories => categories.length > 0).reduce((a, b) => a.concat(b), [])
  var categories = []
  cards.forEach(cat => {
    var catIndex = categories.findIndex(val => val.name === cat)
    if (catIndex !== -1) categories[catIndex].count++
    else categories.push({ name: cat, count: 1 })
  })
  categories = categories.sort((a, b) => a.count < b.count ? 1 : -1)
  res.render('categories', { tab: 'categories', categories })
})

router.get('/vote', async function (req, res) {
  const cards = await Card.find({ published: false, votes: { $not: { $elemMatch: { ip: req.userIP } } } }).sort({ timestamp: -1 }).limit(200).exec()
  res.render('vote', { tab: 'vote', cards })
})

router.get('/vote_action', async function (req, res) {
  const cardID = parseInt(req.query.card)
  const vote = req.query.vote === 'y'
  const userip = req.headers['cf-connecting-ip'] || req.connection.remoteAddress

  const card = await Card.findOne({ id: cardID, published: false }).limit(1).exec()
  if (card) {
    if (!card.votes.find(val => val.ip === userip)) {
      res.json({ success: true, message: 'Vote counted' })
      card.votes.push({
        accepted: vote,
        ip: userip
      })
      card.save()
    } else {
      res.json({ error: true, message: 'You have already voted' })
    }
  } else {
    res.json({ error: true, message: 'Card ID not valid' })
  }
})

module.exports = router
