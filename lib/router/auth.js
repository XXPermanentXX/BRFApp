const url = require('url')
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
    const id = ctx.state.user.cooperative._id || ctx.state.user.cooperative
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

router.post('/', body(), async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (!ctx.isAuthenticated()) {
    let profile
    const { email, password } = ctx.request.body

    try {
      profile = await nodebb.authenticate({ username: email, password })
    } catch (err) {
      const error = new Error('Failed to authenticate user, please check that everything is filled in as it should')
      error.status = 400
      throw error
    }

    const user = await Users.model.findOne({ uid: profile.uid })
    ctx.assert(user, 401)

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
    type: 'signin'
  })
})

router.post('/sign-up', body(), async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (!ctx.isAuthenticated()) {
    let profile
    const { fullname, email, password } = ctx.request.body

    try {
      // compose NodeBB-compatible username
      const username = fullname.toLowerCase().replace(/[^\w]/g, '')
      const token = await nodebb.encode({ fullname, username, email, password, _uid: 1 })
      profile = await nodebb.register(token)
    } catch (err) {
      const error = new Error('Could not create account, please check that everything is filled in as it should')
      error.status = 400
      throw error
    }

    let user = await Users.model.findOne({ uid: profile.uid })

    if (!user) {
      const cooperative = await Cooperatives.create({ hasRegistered: false })
      user = await Users.create({
        uid: profile.payload.uid,
        email: email,
        cooperative: cooperative,
        name: fullname
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
    type: 'signup'
  })
})

router.get('/sign-up', async function (ctx, next) {
  ctx.assert(ctx.accepts('html'), 406)

  if (ctx.isAuthenticated()) {
    const id = ctx.state.user.cooperative._id || ctx.state.user.cooperative
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
  ctx.redirect(url.resolve(
    process.env.METRY_ENDPOINT,
    `/id/register/brf?${[
      'response_type=code',
      `redirect_uri=${url.resolve(
        process.env.BRFENERGI_SERVICE_URL,
        'auth/callback'
      )}`,
      'scope=basic%20add_to_open_channels%20write_meter_location',
      `client_id=${process.env.METRY_CLIENT_ID}`
    ].join('&')}`
  ))
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
    ctx.redirect(url.format({
      pathname: '/auth',
      query: { error: 'METRY_ERROR' }
    }))

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
