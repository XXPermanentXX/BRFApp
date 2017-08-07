const url = require('url');
const express = require('express');
const passport = require('passport');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  if (!req.user) {
    if (req.accepts('html')) {
      req.prismic.api.getSingle('sign-in').then(doc => {
        res.locals.title = doc.getStructuredText('sign-in.title').asText();
        res.locals.content['sign-in'] = doc;
        res.render('/auth');
      }, err => res.status(500).render('/error', { err: err.message }));
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

router.get('/metry', passport.authenticate('metry'));

/**
 * Handle Metry callback redirect
 */

router.get('/callback',
  passport.authenticate('metry', {
    failWithError: true
  }),
  (req, res) => res.redirect(url.format({
    pathname: `/cooperatives/${ req.user.cooperative }`,
    query: { access_token: req.user.accessToken }
  })),
  (err, req, res) => res.redirect(url.format({
    pathname: '/auth',
    query: { access_token: null, err: 'METRY_ERROR' }
  }))
);

/**
 * Sign out
 */

router.get('/signout', auth.authenticate(), (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
