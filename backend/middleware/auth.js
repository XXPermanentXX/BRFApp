const url = require('url');
const crypto = require('crypto');
const request = require('request');
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const User = require('../models').users;

const ENDPOINT = url.parse(process.env.METRY_ENDPOINT_URL);
const {
  METRY_BASE_URL,
  METRY_PATH_AUTHORIZE,
  METRY_PATH_TOKEN,
  METRY_CLIENT_ID,
  METRY_CLIENT_SECRET,
  METRY_PROFILE_PATH,
  BRFENERGI_SERVICE_URL
} = process.env;

/**
 * Extend OAuth2Strategy with an implementation for getting Metry user profile
 */

class MetryOAuth extends OAuth2Strategy {
  userProfile(accessToken, done) {
    request({
      json: true,
      method: 'GET',
      uri: url.format(Object.assign({}, ENDPOINT, {
        pathname: url.resolve(ENDPOINT.pathname, METRY_PROFILE_PATH),
        query: {
          access_token: accessToken
        }
      }))
    }, (err, response, user) => {
      if (err) { return done(err); }
      if (response.body.code !== 200) {
        return done(new Error(response.body.message));
      }
      return done(null, user.data);
    });
  }
}

exports.initialize = function initialize() {

  /**
   * Set up Metry Oauth authentification
   */

  passport.use('metry', new MetryOAuth({
    authorizationURL: url.resolve(METRY_BASE_URL, METRY_PATH_AUTHORIZE),
    tokenURL: url.resolve(METRY_BASE_URL, METRY_PATH_TOKEN),
    clientID: METRY_CLIENT_ID,
    clientSecret: METRY_CLIENT_SECRET,
    callbackURL: url.resolve(BRFENERGI_SERVICE_URL, 'api/auth/metry/callback')
  }, (accessToken, refreshToken, profile, done) => {
    User.model.findOne({ metryId: profile._id }, (err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'User not recognized' });
      }

      /**
       * Store access token to user
       */

      user.accessToken = accessToken;
      user.markModified('accessToken');
      user.save((err, saved) => {
        if (err) { return done(err); }
        done(null, saved);
      });
    });
  }));

  /**
   * Set up bearer strategy for validating token on requests
   */

  passport.use(new BearerStrategy((token, done) => {
    if (!token) { return done(new Error('No token provided')); }

    User.model.findOne({ accessToken: token }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user);
    });
  }));

  /**
   * Serialize user data by _id
   */

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser((id, done) => User.findById(id, done));

  return passport.initialize();
};

/**
 * Wrap authentification handler
 */

exports.authenticate = function authenticate() {
  return passport.authenticate('bearer', { session: false });
};

/**
 * TODO: Remove legacy implementation of locally generated tokens
 */

exports.genToken = function genToken(callback) {
  crypto.randomBytes(48, (ex, buf) => callback(buf.toString('hex')));
};

exports.newUserToken = function newUserToken(user, callback) {
  exports.genToken(token => {
    user.token = token;
    user.save(err => callback(err, token));
  });
};
