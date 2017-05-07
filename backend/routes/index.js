const express = require('express');
const Cooperatives = require('../models/cooperatives');

const router = module.exports = express.Router();

/**
 * Relay to seperate rout modules
 */

router.use('/user', footer, require('./user'));
router.use('/cooperatives', footer, require('./cooperative'));
router.use('/actions', footer, require('./action'));
router.use('/auth', footer, require('./auth'));

/**
 * Duplicate of the `/cooperatives` route
 * FIXME: Figure out a DRYer appraoch to this when refactoring urls
 */

router.get('/', footer, (req, res) => {
  Cooperatives.all((err, cooperatives) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      res.render('/cooperatives', cooperatives, done => {
        done(null, {
          cooperatives: cooperatives.map(cooperative => cooperative.toJSON())
        });
      });
    }
  });
});

/**
 * Content pages
 */

router.get('/how-it-works', footer, (req, res, next) => {
  req.prismic.api.getSingle('faq').then(doc => {
    res.locals.title = doc.getStructuredText('faq.title').asText();
    res.render('/how-it-works', { faq: doc });
  }, next);
});

router.get('/about-the-project', footer, (req, res, next) => {
  req.prismic.api.getSingle('about').then(doc => {
    res.locals.title = doc.getStructuredText('about.title').asText();
    res.render('/about-the-project', { about: doc });
  }, next);
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
