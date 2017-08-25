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
    if ((err && !cooperative) || !cooperative.needUpdate) {
      next();
    } else {
      res.redirect(url);
    }
  });
});

/**
 * Relay to seperate route modules
 */

router.use('/users', onboarding, footer, require('./user'));
router.use('/cooperatives', onboarding, footer, require('./cooperative'));
router.use('/actions', onboarding, footer, require('./action'));

/**
 * Landing page
 */

router.get('/', onboarding, footer, (req, res, next) => {
  Cooperatives.all((err, cooperatives) => {
    if (err) {
      if (cooperatives) {
        res.locals.error = err.message;
      } else {
        res.status(500).render('/error', { error: err.message });
      }
    }

    if (cooperatives) {
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
    res.locals.content.faq = doc;
    res.render('/how-it-works');
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
    res.locals.content.about = doc;
    res.render('/about-the-project');
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
    res.locals.content.footer = doc;
    next();
  }, next);
}

/**
 * Insert onboarding content for first time visitors
 */

function onboarding(req, res, next) {
  if (!req.accepts('html')) { return next(); }

  const userBoarded = (req.user && req.user.hasBoarded);
  let hasBoarded = userBoarded || JSON.parse(req.cookies.hasBoarded || false);

  if (req.query.hasBoarded) {
    hasBoarded = true;
    res.cookie('hasBoarded', true);

    if (req.user) {
      req.user.hasBoarded = true;
      return req.user.save(next);
    }
  }

  if (hasBoarded) {
    res.locals.hasBoarded = true;
    return next();
  }

  req.prismic.api.getSingle('onboarding').then(doc => {
    res.locals.content.onboarding = doc;
    next();
  }, next);
}
