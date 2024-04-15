const { URL } = require('url')
const dedent = require('dedent')
const Router = require('@koa/router')
const Cooperatives = require('../models/cooperatives')
const cooperative = require('./cooperative')
const Log = require('../models/logs')
const action = require('./action')
const user = require('./user')
const page = require('./page')
const auth = require('./auth')

const router = module.exports = new Router()

router.use(serialize)
router.use(onboarding)

/**
 * Deny robots access to anything but production environment
 */

router.get('/robots.txt', function (ctx, next) {
  ctx.type = 'text/plain'
  ctx.body = dedent`
    User-agent: *
    Disallow: ${process.env.NODE_ENV === 'production' ? '' : '/'}
  `
})

/**
 * Expose all cooperatives on homepage
 */

router.get('/', async function (ctx, next) {
  if (!ctx.accepts('html')) ctx.throw(406)
  console.log(1231)
  const { longitude = 18.0735828, latitude = 59.3124701 } = ctx.state.geoip
  const cooperatives = await Cooperatives.near([longitude, latitude])
  ctx.state.cooperatives = cooperatives.map((model) => model.toJSON())

  Log.create({
    userId: ctx.state.user && ctx.state.user._id,
    category: 'Cooperatives',
    type: 'get'
  })
})

/**
 * Toggle user tracking
 */

router.get('/tracking:toggle(on|off)', (ctx, next) => {
  const value = JSON.stringify(ctx.params.toggle === 'off')
  ctx.cookies.set('DISABLE_TRACKING', value, {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 3,
    httpOnly: false,
    signed: false
  })

  if (ctx.query.referrer) {
    const { pathname } = new URL(decodeURIComponent(ctx.query.referrer))
    ctx.redirect(pathname)
  } else {
    ctx.redirect('/')
  }
})

/**
 * Relay to seperate route modules
 */

router.use('/auth', auth.routes(), auth.allowedMethods())
router.use('/cooperatives', cooperative.routes(), cooperative.allowedMethods())
router.use('/actions', action.routes(), action.allowedMethods())
router.use('/users', user.routes(), user.allowedMethods())
router.use(page.routes(), page.allowedMethods())

/**
 * Populate state user and cooperatives with user cooperative
 */

async function serialize (ctx, next) {
  try {
    await next()
  } finally {
    const user = ctx.state.user
    if (!user) {
      // Explicitly set to `null` to prevent inheriting from prev render passes
      ctx.state.user = null
    } else {
      ctx.state.user = user.toJSON()
      const id = ctx.state.user.cooperative
      const cooperatives = ctx.state.cooperatives = ctx.state.cooperatives || []
      if (!cooperatives.find(item => item._id.toString() === id)) {
        cooperatives.push(user.cooperative.toJSON())
      }
    }
  }
}

/**
 * Insert onboarding content for first time visitors
 */

async function onboarding (ctx, next) {
  if (!ctx.accepts('html')) return next()

  const user = ctx.state.user
  const userBoarded = (user && user.hasBoarded)
  let hasBoarded = userBoarded || JSON.parse(ctx.cookies.get('HAS_BOARDED') || false)

  if (ctx.query.hasBoarded) {
    hasBoarded = true
    ctx.cookies.set('HAS_BOARDED', true, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2),
      httpOnly: false,
      signed: false
    })

    if (user) {
      user.hasBoarded = true
      await user.save(next)
    }
  }

  if (hasBoarded) {
    ctx.state.hasBoarded = true
    return next()
  }

  await ctx.prismic.api.getSingle('onboarding').then(doc => {
    ctx.state.content = ctx.state.content || {}
    ctx.state.content.onboarding = doc
  })

  return next()
}
