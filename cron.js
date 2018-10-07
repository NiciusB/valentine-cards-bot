const fs = require('fs')
const Card = require('./models/Card')
const Queue = require('./models/Queue')
const Twit = require('twit')

var credentials = []
try {
  credentials = JSON.parse(fs.readFileSync('./credentials.json'))
} catch (e) {
  console.error('Please create a credentials.json file with your twitter bot API credentials following the example at credentials.example.json')
  process.exit(1)
}

module.exports = () => {
  setInterval(processQueue, 1000 * 60 * 15)
  setInterval(checkNonPublishedCards, 1000 * 60)
}

async function checkNonPublishedCards() {
  const votation_minimum = 7 // number of votes (minus the opposite ones) needed to win the votation
  const cards = await Card.find({ published: false })
  cards.forEach(card => {
    const vote_score = card.votes.map(vote => vote.accepted ? 1 : -1).reduce((vote, total) => total + vote, 0)
    if (vote_score >= votation_minimum) {
      card.published = true
      card.votes = []
      card.save()
    } else if (vote_score <= -votation_minimum) {
      card.remove()
      fs.unlink(`uploads/${card.id}.${card.format}`, () => {})
    }
  })
}

async function processQueue() {
  const messagesInQueue = await Queue.find().sort({timestamp: 1}).limit(credentials.length).exec()
  messagesInQueue.forEach((message, index) => {
    var T = new Twit({
      consumer_key:         credentials[index][0],
      consumer_secret:      credentials[index][1],
      access_token:         credentials[index][2],
      access_token_secret:  credentials[index][3],
      timeout_ms:           60 * 1000,  // optional HTTP request timeout to apply to all requests.
      strictSSL:            true     // optional - requires SSL certificates to be valid.
    })
    sendTweet(T, message)
  })
}

async function sendTweet(T, message) {
  const card = await Card.findOne({id: message.card}).exec()

  var b64content = fs.readFileSync(`uploads/${card.id}.${card.format}`, { encoding: 'base64' })
  // Upload image
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    if (err) {
      console.error(err)
      return
    }

    // Attach image to tweet
    const params = {
      status: `@${message.username} someone sent you this card!`,
      media_ids: [data.media_id_string]
    }
    T.post('statuses/update', params).then(res => {
      message.remove() // Remove from queue
      if (!res.data || !res.data.created_at) {
        console.error(data)
        // Remove tweet if there were no mentions
        if (!res.data.entities || !res.data.entities.user_mentions.length) {
          T.post('statuses/destroy/:id', { id: res.data.id_str })
        }
      }
    })
  })
}
