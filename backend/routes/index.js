const express = require('express');
const Cooperatives = require('../models/cooperatives');
const Log = require('../models/logs');

const router = module.exports = express.Router();

/**
 * Any type of authentification takes precedence
 */

router.use('/auth', footer, require('./auth'));

/**
 * Redirect legacy cooperatives to cooperative edit page
 */

router.use((req, res, next) => {
  // Check that user is logged in
  if (!req.accepts('html') || !req.user) { return next(); }

  const id = req.user.cooperative;
  const url = `/cooperatives/${ id }/edit`;

  // Exit if user is already accessing the edit page
  if (req.url === url) { return next(); }

  Cooperatives.get(id, (err, cooperative) => {
    if (err || !cooperative.needUpdate) {
      next();
    } else {
      res.redirect(url);
    }
  });
});

/**
 * Relay to seperate route modules
 */

router.use('/user', onboarding, footer, require('./user'));
router.use('/cooperatives', onboarding, footer, require('./cooperative'));
router.use('/actions', onboarding, footer, require('./action'));

/**
 * Landing page
 */

router.get('/', onboarding, footer, (req, res, next) => {
  Cooperatives.all((err, cooperatives) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      res.render('/', cooperatives, done => {
        done(null, {
          cooperatives: cooperatives.map(cooperative => cooperative.toJSON())
        });
      });
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'get'
  });
});

/**
 * Content pages
 */

router.get('/how-it-works', onboarding, footer, (req, res, next) => {
  req.prismic.api.getSingle('faq').then(doc => {
    res.locals.title = doc.getStructuredText('faq.title').asText();
    res.render('/how-it-works', { faq: doc });
  }, next);

  Log.create({
    userId: req.user && req.user._id,
    category: 'FAQ',
    type: 'get'
  });
});

router.get('/about-the-project', onboarding, footer, (req, res, next) => {
  req.prismic.api.getSingle('about').then(doc => {
    res.locals.title = doc.getStructuredText('about.title').asText();
    res.render('/about-the-project', { about: doc });
  }, next);

  Log.create({
    userId: req.user && req.user._id,
    category: 'About',
    type: 'get'
  });
});

/**
 * Shared footer middleware
 */

function footer(req, res, next) {
  if (!req.accepts('html')) { return next(); }

  req.prismic.api.getSingle('footer').then(doc => {
    res.locals.footer = doc;
    next();
  }, next);
}

/**
 * Insert onboarding content for first time visitors
 */

function onboarding(req, res, next) {
  const userBoarded = (req.user && req.user.hasBoarded);
  let hasBoarded = userBoarded || JSON.parse(req.cookies.hasBoarded || false);

  if (req.query.hasBoarded) {
    if (req.user) {
      req.user.hasBoarded = true;
      req.user.save();
    }

    res.cookie('hasBoarded', true);
    hasBoarded = true;
  }

  if (!req.accepts('html') || hasBoarded) {
    return next();
  }

  req.prismic.api.getSingle('onboarding').then(doc => {
    res.locals.onboarding = doc;
    next();
  }, next);
}
