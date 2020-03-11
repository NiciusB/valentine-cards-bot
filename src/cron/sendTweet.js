
const fs = require('fs')
const util = require('util')
const path = require('path')
const Twitter = require('twitter-lite')
const Card = require('../models/Card')
const Queue = require('../models/Queue')
const crossFetch = require('cross-fetch')

const readFileAsync = util.promisify(fs.readFile)

const frequencyMs = process.env.TWEET_MS_INTERVAL
module.exports.setupSendTweetCron = () => {
  const nextTweetTs = Math.ceil(Date.now() / frequencyMs) * frequencyMs
  const nowTs = Date.now()

  const executeFn = () => {
    const fn = process.env.TWEET_TYPE === 'mentionsFromQueue' ? sendNextCardFromCardsQueue : publiclyTweetRandomCard
    return fn().catch(console.error)
  }

  setTimeout(() => {
    executeFn()
    setInterval(executeFn, frequencyMs)
  }, nextTweetTs - nowTs)
  if (process.env.NODE_ENV === 'development') executeFn()
}

var credentials = []
try {
  credentials = JSON.parse(process.env.TWITTER_CREDENTIALS_JSON_STRING)
} catch (e) {
  console.error('Please create a TWITTER_CREDENTIALS_JSON_STRING env variable with your twitter bot API credentials following the example at /.env.example')
  process.exit(1)
}

async function sendNextCardFromCardsQueue () {
  const messagesInQueue = await Queue.find().sort({ timestamp: 1 }).limit(credentials.length).exec()
  await messagesInQueue.map(async (message, index) => {
    const card = await Card.findOne({ published: true, id: message.card }).exec()
    const tweetStatus = `@${message.username} someone sent you this card!`
    try {
      await sendTweet({ credentialsArray: credentials[index], tweetStatus, card, removeIfNoMentions: true })
    } catch (err) {
      console.error(err)
    }
    message.remove() // Remove from queue
  })
}

async function publiclyTweetRandomCard () {
  const index = 0 // Main account. Maybe we could tweet from all?

  const cardsCount = await Card.countDocuments({ published: true }).exec()
  const randomEntry = Math.floor(Math.random() * cardsCount)
  const randomCard = await Card.findOne({ published: true }).skip(randomEntry).exec()
  await sendTweet({ credentialsArray: credentials[index], tweetStatus: '', card: randomCard, removeIfNoMentions: false })
}

async function sendTweet ({ credentialsArray, tweetStatus, card, removeIfNoMentions }) {
  const twClient = new Twitter({
    consumer_key: credentialsArray[0],
    consumer_secret: credentialsArray[1],
    access_token_key: credentialsArray[2],
    access_token_secret: credentialsArray[3]
  })
  const twUploadClient = new Twitter({
    subdomain: 'upload',
    consumer_key: credentialsArray[0],
    consumer_secret: credentialsArray[1],
    access_token_key: credentialsArray[2],
    access_token_secret: credentialsArray[3]
  })

  // Upload image
  const b64content = await readFileAsync(path.join(__dirname, '..', '..', 'uploads', `${card.id}.${card.format}`), { encoding: 'base64' })
  const mediaUploadData = await twUploadClient.post('media/upload', { media_data: b64content })

  // Set alt text for image
  if (card.alt && card.alt.length > 0) {
    await customTwitterPostForAltText(twUploadClient, { media_id: mediaUploadData.media_id_string, alt_text: { text: card.alt } })
  }

  // Attach image to tweet
  const params = {
    status: tweetStatus,
    media_ids: [mediaUploadData.media_id_string]
  }

  // Tweet
  const tweetData = await twClient.post('statuses/update', params)

  // Log if something went wrong
  if (!tweetData || !tweetData.created_at) {
    throw new Error('[sendTweet] Something went wrong while tweeting: ' + JSON.stringify({ tweetData, mediaUploadData }))
  }

  if (removeIfNoMentions) {
    // Remove tweet if there were no mentions
    if (!tweetData.entities || !tweetData.entities.user_mentions.length) {
      await twClient.post(`statuses/destroy/${tweetData.id_str}`)
    }
  }
}

function customTwitterPostForAltText (twitterClient, body) {
  const resource = 'media/metadata/create'
  const baseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  const { requestData, headers } = twitterClient._makeRequest(
    'POST',
    resource,
    null // don't sign JSON bodies; only parameters
  )

  const postHeaders = Object.assign({}, baseHeaders, headers)
  body = JSON.stringify(body)

  return crossFetch(requestData.url, {
    method: 'POST',
    headers: postHeaders,
    body
  })
    .then(res => {
      if (res.status !== 200) throw new Error('[customTwitterPostForAltText] ' + JSON.stringify(res))
    })
}
