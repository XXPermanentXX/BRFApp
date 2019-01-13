const got = require('got')
const { URL } = require('url')
const body = require('koa-body')
const Router = require('koa-router')
const passport = require('koa-passport')
const nodebb = require('../nodebb')
const Log = require('../models/logs')
const Users = require('../models/users')
const Cooperatives = require('../models/cooperatives')

const router = module.exports = new Router()

router.get('/', async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (ctx.isAuthenticated()) {
    let id = ctx.state.user.cooperative._id || ctx.state.user.cooperative
    ctx.redirect(`/cooperatives/${id}`)
  } else {
    await ctx.prismic.api.getSingle('sign-in').then(doc => {
      ctx.state.content = ctx.state.content || {}
      ctx.state.content['sign-in'] = doc
    })

    Log.create({
      category: 'Auth',
      type: 'get'
    })
  }
})

// TODO: remove once forum endpoint is in place
router.get('/faux', async function (ctx, next) {
  const encryptor = require('simple-encryptor')(process.env.URL_ENCRYPTION_KEY)
  const decoded = await nodebb.verify(ctx.query.token)
  const message = encryptor.decrypt(decoded.msg)
  // this is where we'd look up user by metryId or email and verify password
  ctx.type = 'application/json'
  ctx.body = { userId: message.email }
})

router.post('/', body(), async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (!ctx.isAuthenticated()) {
    let props = await nodebb.encode({
      email: ctx.request.body.email,
      password: ctx.request.body.password
    }).then(nodebb.authenticate)
    let user = await Users.model.findOne({ userId: props.userId })
    ctx.assert(user || ctx.request.body.create, 401)

    if (!user) {
      let cooperative = await Cooperatives.create({ hasRegistered: false })
      user = await Users.create({
        userId: props.userId,
        email: ctx.request.body.email,
        cooperative: cooperative,
        name: props.name,
        lang: props.lang
      })
      cooperative.editors.push(user._id)
      await cooperative.save()
    }

    await ctx.login(user)
  }

  const cooperative = await Cooperatives.get(ctx.state.user.cooperative)
  if (!cooperative.needUpdate && cooperative.hasRegistered) {
    ctx.redirect(`/cooperatives/${cooperative._id}`)
  } else {
    ctx.redirect(`/cooperatives/${cooperative._id}/edit`)
  }

  Log.create({
    userId: ctx.state.user._id,
    category: 'Auth',
    type: ctx.request.body.create ? 'signup' : 'signin'
  })
})

router.get('/sign-up', async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (ctx.isAuthenticated()) {
    let id = ctx.state.user.cooperative._id || ctx.state.user.cooperative
    ctx.redirect(`/cooperatives/${id}`)
  } else {
    await ctx.prismic.api.getSingle('registration').then(doc => {
      ctx.state.content = ctx.state.content || {}
      ctx.state.content.registration = doc
    })

    Log.create({
      category: 'Auth',
      type: 'get'
    })
  }
})

/**
 * Redirect to Metry OAuth
 */

router.get('/metry', passport.authenticate('metry', {
  failureRedirect: '/auth'
}))

/**
 * Sign up
 */

router.get('/metry/sign-up', function (ctx, next) {
  const { href } = new URL(`/id/register/brf?${[
    'response_type=code',
    `redirect_uri=${new URL('auth/callback', process.env.BRFENERGI_SERVICE_URL).href}`,
    'scope=basic%20add_to_open_channels%20write_meter_location',
    `client_id=${process.env.METRY_CLIENT_ID}`
  ].join('&')}`, process.env.METRY_ENDPOINT)

  ctx.redirect(href)
})

/**
 * Handle Metry callback redirect
 */

router.get('/callback', async function (ctx, next) {
  try {
    await passport.authenticate('metry')(ctx, async function () {
      const id = ctx.state.user.cooperative
      const cooperative = await Cooperatives.get(id)
      if (!cooperative.needUpdate && cooperative.hasRegistered) {
        ctx.redirect(`/cooperatives/${cooperative._id}`)
      } else {
        ctx.redirect(`/cooperatives/${cooperative._id}/edit`)
      }
    })
  } catch (err) {
    ctx.redirect('/auth?error=METRY_ERROR')

    Log.create({
      category: 'Error',
      type: 'auth',
      data: err.message
    })
  }
})

/**
 * Sign out
 */

router.get('/signout', function (ctx) {
  ctx.assert(ctx.isAuthenticated(), 401)
  ctx.logout()
  ctx.redirect('/')
})
