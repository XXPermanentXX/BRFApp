const url = require('url');
const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/metry', passport.authenticate('metry', { session: false }));
router.get('/metry/callback',
  passport.authenticate('metry', {
    session: false,
    failWithError: true,
    // FIXME: Should use error middleware instead (see below)
    failureRedirect: makeUrl('welcome/error', { err: 'METRY_ERROR' })
  }),
  (req, res) => res.redirect(makeUrl('welcome/success', {
    access_token: req.user.accessToken
  })),
  (err, req, res) => {
    // FIXME: Does not run due to some other error handler mocking about
    res.redirect(makeUrl('welcome/error', { message: 'METRY_ERROR' }));
  }
);

function makeUrl(hash, query = null) {
  const endpoint = url.parse(process.env.YOUPOWER_CLIENT_URL);
  let hashed =  url.format(Object.assign(endpoint, {
    query: {},
    hash: `#/${ hash }`,
  }));

  /**
   * Append query string after hash because Angular is silly that way
   * @see: https://github.com/angular/angular.js/issues/6172
   */

  if (query || endpoint.query) {
    const params = Object.assign({}, endpoint.query, query);
    const pairs = Object.keys(params).map(key => `${ key }=${ params[key] }`);
    hashed += `?${ pairs.join('&') }`;
  }

  return hashed;
}

module.exports = router;
