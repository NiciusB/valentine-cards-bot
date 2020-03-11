require('dotenv').config()
const Twitter = require('twitter-lite')
const express = require('express')

const app = express()

var credentials = []
try {
  credentials = JSON.parse(process.env.TWITTER_CREDENTIALS_JSON_STRING)
} catch (e) {
  console.error('Please create a TWITTER_CREDENTIALS_JSON_STRING env variable with your twitter bot API credentials following the example at /.env.example')
  process.exit(1)
}

let lastOauthTokenSecret
app.get('/', async (req, res) => {
  try {
    const baseTwClient = new Twitter({
      consumer_key: credentials[0][0],
      consumer_secret: credentials[0][1]
    })

    const isComingBackFromAuth = Boolean(req.query.oauth_token)

    if (isComingBackFromAuth) {
      const authResponse = await baseTwClient
        .getAccessToken({
          key: req.query.oauth_token,
          secret: lastOauthTokenSecret,
          verifier: req.query.oauth_verifier
        })

      if (!authResponse.oauth_token) throw new Error(JSON.stringify(authResponse))

      res.status(200).send(`<pre>
Consumer key: ${credentials[0][0]}
Consumer secret: ${credentials[0][1]}
Oauth token: ${authResponse.oauth_token}
Oauth token secret: ${authResponse.oauth_token_secret}
</pre>`)
    } else {
      const requestTokenResponse = await baseTwClient
        .getRequestToken(APP_URL)

      if (!requestTokenResponse.oauth_token) throw new Error(JSON.stringify(requestTokenResponse))

      const redirectUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestTokenResponse.oauth_token}`
      lastOauthTokenSecret = requestTokenResponse.oauth_token_secret

      res.status(307).set({ Location: redirectUrl }).send(`Redirecting to ${redirectUrl} ...`)
    }
  } catch (err) {
    console.error(err)
    res.status(500).send(`<pre>${err}</pre>`)
  }
})

const PORT = 3423
const APP_URL = `http://localhost:${PORT}`
app.listen(PORT, () => console.log(`DEV Login server listening on ${APP_URL}`))
