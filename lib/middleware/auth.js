let got
import('got').then(gotModule => {
  got = gotModule.default
}).catch(err => console.error('Failed to load the got module', err))

const { URL } = require('url')
const compose = require('koa-compose')
const passport = require('koa-passport')
const OAuth2Strategy = require('passport-oauth2').Strategy
const nodebb = require('../nodebb')
const Log = require('../models/logs')
const Users = require('../models/users')
const Cooperatives = require('../models/cooperatives')

const {
  METRY_ENDPOINT,
  METRY_CLIENT_ID,
  METRY_CLIENT_SECRET,
  BRFENERGI_SERVICE_URL
} = process.env

/**
 * Extend OAuth2Strategy with an implementation for getting Metry user profile
 */

class MetryOAuth extends OAuth2Strategy {
  userProfile (accessToken, done) {
    getProfile(accessToken).then(profile => {
      if (profile.is_organization) {
        return getUser(accessToken).then(user => done(null, user))
      }
      done(null, profile)
    }).catch(done)
  }
}

module.exports = auth

function auth () {
  /**
   * Set up Metry Oauth authentification
   */

  passport.use('metry', new MetryOAuth({
    authorizationURL: new URL('/oauth/authorize', METRY_ENDPOINT).href,
    tokenURL: new URL('/oauth/token', METRY_ENDPOINT).href,
    clientID: METRY_CLIENT_ID,
    clientSecret: METRY_CLIENT_SECRET,
    callbackURL: new URL('auth/callback', BRFENERGI_SERVICE_URL).href,
    scope: ['basic', 'add_to_open_channels', 'write_meter_location']
  }, (accessToken, refreshToken, profile, done) => {
    Users.model.findOne({ metryId: profile._id }, async (err, user) => {
      if (err) return done(err)

      try {
        // Add missing user
        if (!user) {
          user = await getLegacyUser(accessToken, profile)
          if (!user) {
            user = await addUser(accessToken, profile)
          }
        }

        // Touch account on forum - don't actually care about the response.
        try {
          const token = nodebb.authenticationToken(user)
          await got(process.env.FORUM_URL + '/auth/brf?brfauth=' + token)
          user.forumAuthenticationToken = token
        } catch (e) {
          Log.create({
            category: 'User',
            type: 'forum',
            data: 'Error while touching user forum account: ' + e
          })
        }

        await Cooperatives.sync(user.cooperative, accessToken)
      } catch (err) {
        return done(err)
      }

      user.refreshToken = refreshToken
      user.accessToken = accessToken
      user.save(done)
    })
  }))

  /**
   * Serialize user data by _id
   */

  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser(function (id, done) {
    Users.get(id).then(function (user) {
      done(null, user)
    }, done)
  })

  return compose([cleanup, passport.initialize(), passport.session()])
}

/**
 * Prevent leaking passport instance upstream
 */

async function cleanup (ctx, next) {
  await next()
  Object.defineProperty(ctx.state._passport, 'toJSON', {
    value: function () {
      return null
    }
  })
}

/**
 * Get legacy user which is identified by organization id
 * @param {String} accessToken
 * @return {Promise}
 */

async function getLegacyUser (accessToken, profile) {
  const organization = await getProfile(accessToken)

  // Lookup user by org id
  const user = await Users.model.findOne({ metryId: organization._id })

  if (user) {
    // Update user with proper profile id
    user.metryId = profile._id
    await Promise.all([
      user.save(),
      Cooperatives.model.findOne({ _id: user.cooperative }).then(cooperative => {
        // Save organization id to cooperative
        cooperative.metryId = organization._id
        return cooperative.save()
      })
    ])
  }

  return user
}

/**
 * Add user and cooperative (if missing)
 *
 * @param {object} data User profile object
 * @returns {Promise}
 */

async function addUser (accessToken, profile) {
  const organization = await getProfile(accessToken)

  let cooperative = await Cooperatives.model.findOne({
    metryId: organization._id
  })

  if (!cooperative) {
    const props = { metryId: organization._id, hasRegistered: false }
    if (organization.name) props.name = organization.name
    cooperative = await Cooperatives.create(props)
  }

  const user = await Users.create({
    metryId: profile._id,
    name: (profile.account || profile).name || '',
    email: (profile.account || profile).username,
    cooperative: cooperative
  })

  cooperative.editors.push(user._id)
  await cooperative.save()

  return user
}

function getProfile (token) {
  const { href } = new URL(`accounts/me?access_token=${token}`, METRY_ENDPOINT)
  return got(href, { json: true }).then(response => {
    if (response.body.code !== 200) { throw new Error(response.body.message) }
    return response.body.data
  })
}

function getUser (token) {
  const { href } = new URL(
    `accounts/me/authenticated_collaborator?access_token=${token}`,
    METRY_ENDPOINT
  )
  return got(href, { json: true }).then(response => {
    if (response.body.code !== 200) { throw new Error(response.body.message) }
    return response.body.data
  })
}
