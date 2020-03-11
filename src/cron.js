const fs = require('fs')
const Card = require('./models/Card')
const { setupSendTweetCron } = require('./cron/sendTweet')

module.exports = () => {
  setInterval(checkNonPublishedCards, 1000 * 60)
  setTimeout(checkNonPublishedCards, 1000)
  setupSendTweetCron()
}

async function checkNonPublishedCards () {
  // number of votes (minus the opposite ones) needed to win the votation
  const votationMinimum = process.env.NODE_ENV === 'development' ? 1 : 8

  const cards = await Card.find({ published: false })
  cards.forEach(card => {
    const voteScore = card.votes.map(vote => vote.accepted ? 1 : -1).reduce((vote, total) => total + vote, 0)
    if (voteScore >= votationMinimum) {
      card.published = true
      card.votes = []
      card.save()
    } else if (voteScore <= -votationMinimum) {
      card.remove()
      fs.unlink(`uploads/${card.id}.${card.format}`, () => {})
    }
  })
}
