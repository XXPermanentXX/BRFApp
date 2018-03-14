const url = require('url')
const express = require('express')
const auth = require('../middleware/auth')
const Cooperatives = require('../models/cooperatives')
const Log = require('../models/logs')

const router = module.exports = express.Router()

/**
 * Any type of authentification takes precedence
 */

router.use('/auth', onboarding, require('./auth'))

/**
 * Redirect legacy cooperatives to cooperative edit page
 */

router.use((req, res, next) => {
  // Check that user is logged in
  if (!req.accepts('html') || !req.user) { return next() }

  const id = req.user.cooperative
  const url = `/cooperatives/${id}/edit`

  // Exit if user is already accessing the edit page
  if (req.url === url) { return next() }

  Cooperatives.get(id).then(cooperative => {
    if (!cooperative.needUpdate && cooperative.hasRegistered) {
      next()
    } else {
      res.redirect(url)
    }
  }, next)
})

/**
 * Relay to seperate route modules
 */

router.use('/users', onboarding, require('./user'))
router.use('/cooperatives', onboarding, require('./cooperative'))
router.use('/actions', onboarding, require('./action'))

/**
 * Landing page
 */

router.get('/', onboarding, (req, res, next) => {
  Cooperatives.all().then(cooperatives => {
    res.render('/', cooperatives, done => {
      done(null, {
        cooperatives: cooperatives.map(cooperative => cooperative.toJSON())
      })
    })
  }, next)

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperatives',
    type: 'get'
  })
})

/**
 * Content pages
 */

router.get('/how-it-works', onboarding, (req, res, next) => {
  req.prismic.api.getSingle('faq').then(doc => {
    res.locals.title = doc.getStructuredText('faq.title').asText()
    res.locals.content.faq = doc
    res.render('/how-it-works')
  }, next)

  Log.create({
    userId: req.user && req.user._id,
    category: 'FAQ',
    type: 'get'
  })
})

router.get('/about-the-project', onboarding, (req, res, next) => {
  req.prismic.api.getSingle('about').then(doc => {
    res.locals.title = doc.getStructuredText('about.title').asText()
    res.locals.content.about = doc
    res.render('/about-the-project')
  }, next)

  Log.create({
    userId: req.user && req.user._id,
    category: 'About',
    type: 'get'
  })
})

/**
 * Toggle user tracking
 */

router.get('/tracking', (req, res) => {
  res.cookie('DISABLE_TRACKING', req.cookies.DISABLE_TRACKING !== 'true', {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 3
  })

  try {
    res.redirect(url.parse(decodeURIComponent(req.query.redirect)).pathname)
  } catch (err) {
    res.redirect('/')
  }
})

/**
 * Insert onboarding content for first time visitors
 */

function onboarding (req, res, next) {
  if (!req.accepts('html')) { return next() }

  const userBoarded = (req.user && req.user.hasBoarded)
  let hasBoarded = userBoarded || JSON.parse(req.cookies.HAS_BOARDED || false)

  if (req.query.hasBoarded) {
    hasBoarded = true
    res.cookie('HAS_BOARDED', true, {
      maxAge: 1000 * 60 * 60 * 24 * 28 * 3
    })

    if (req.user) {
      req.user.hasBoarded = true
      return req.user.save(next)
    }
  }

  if (hasBoarded) {
    res.locals.hasBoarded = true
    return next()
  }

  req.prismic.api.getSingle('onboarding').then(doc => {
    res.locals.content.onboarding = doc
    next()
  }, next)
}
