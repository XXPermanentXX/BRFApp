const url = require('url');
const express = require('express');
const passport = require('passport');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', function (req, res) {
  if (!req.user) {
    res.render('/auth');
  } else {
    res.redirect(`/cooperatives/${ req.user.cooperativeId }`);
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
    pathname: `/cooperatives/${ req.user.cooperativeId }`,
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

router.get('/signout', auth.authenticate(), function (req, res) {
  delete req.user.accessToken;
  req.user.markModified('accessToken');
  req.user.save(err => {
    req.logout();

    if (err) {
      res.status(500).render('/error');
    } else {
      res.redirect('/');
    }
  });
});

module.exports = router;
