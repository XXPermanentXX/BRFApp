const express = require('express')
const { asText } = require('prismic-richtext')
const Log = require('../models/logs')
const Cooperatives = require('../models/cooperatives')

const router = module.exports = express.Router()

router.get('/', (req, res, next) => {
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

router.get('/how-it-works', (req, res, next) => {
  req.prismic.api.getSingle('faq').then(doc => {
    res.locals.title = asText(doc.data.title).trim()
    res.locals.content.faq = doc
    res.render('/how-it-works')
  }, next)

  Log.create({
    userId: req.user && req.user._id,
    category: 'FAQ',
    type: 'get'
  })
})

router.get('/about-the-project', (req, res, next) => {
  req.prismic.api.getSingle('about').then(doc => {
    res.locals.title = asText(doc.data.title).trim()
    res.locals.content.about = doc
    res.render('/about-the-project')
  }, next)

  Log.create({
    userId: req.user && req.user._id,
    category: 'About',
    type: 'get'
  })
})
