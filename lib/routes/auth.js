const url = require('url');
const express = require('express');
const passport = require('passport');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res, next) => {
  if (!req.user) {
    if (req.accepts('html')) {
      req.prismic.api.getSingle('sign-in').then(doc => {
        res.locals.title = doc.getStructuredText('sign-in.title').asText();
        res.locals.content['sign-in'] = doc;
        res.render('/auth');
      }, next);
    } else {
      res.status(406).end();
    }
  } else {
    res.redirect(`/cooperatives/${ req.user.cooperative }`);
  }
});

/**
 * Redirect to Metry OAuth
 */

router.get('/metry', passport.authenticate('metry', {
  failureRedirect: '/auth'
}));

/**
 * Handle Metry callback redirect
 */

router.get('/callback', (req, res, next) => {
  passport.authenticate('metry', (err, user) => {
    if (err) {
      res.redirect(url.format({
        pathname: '/auth',
        query: { error: 'METRY_ERROR' }
      }));
    } else {
      req.logIn(user, err => {
        if (err) { return next(err); }
        res.redirect(`/cooperatives/${ user.cooperative }`);
      });
    }
  })(req, res, next);
});

/**
 * Sign out
 */

router.get('/signout', auth.authenticate(), (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
