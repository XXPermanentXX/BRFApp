const url = require('url');
const request = require('request');
const passport = require('passport');
const basic = require('express-basic-auth');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const Users = require('../models/users');
const Cooperatives = require('../models/cooperatives');

const ENDPOINT = url.parse(process.env.METRY_ENDPOINT_URL);
const {
  METRY_BASE_URL,
  METRY_PATH_AUTHORIZE,
  METRY_PATH_TOKEN,
  METRY_CLIENT_ID,
  METRY_OPEN_CHANNEL,
  METRY_CLIENT_SECRET,
  METRY_PROFILE_PATH,
  METRY_PATH_METERS,
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
    callbackURL: url.resolve(BRFENERGI_SERVICE_URL, 'auth/callback'),
    scope: [ 'basic', 'add_to_open_channels' ]
  }, (accessToken, refreshToken, profile, done) => {
    Users.model.findOne({ metryId: profile._id }, (err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'User not recognized' });
      }

      const options = {
        json: true,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ accessToken }` }
      };

      /**
       * Fetch cooperative meters
       */

      request(Object.assign({}, options, {
        uri: url.format(Object.assign({}, ENDPOINT, {
          pathname: url.resolve(ENDPOINT.pathname, METRY_PATH_METERS),
          query: { box: 'active' }
        }))
      }), (err, response, body) => {
        if (err) { return done(err); }
        if (response.body.code !== 200) {
          return done(new Error(response.body.message));
        }

        /**
         * Check for new or legacy meters
         */

        Cooperatives.model.findOne({
          _id: user.cooperative
        }, async (err, cooperative) => {
          if (err) { return done(err); }

          const missing = body.data.filter((meter) => {
            return meter.location && !cooperative.meters.find(({ meterId }) => {
              return meterId === meter._id;
            });
          });

          const excess = cooperative.meters.filter(meter => {
            return !body.data.find(({ _id }) => _id === meter.meterId);
          });

          try {
            if (missing.length) {
              await Promise.all(missing.map(addMeter(options)));
            }

            if (missing.length || excess.length) {
              await updateMeters(cooperative, missing, excess);
            }
          } catch (err) {
            return done(err);
          }

          user.accessToken = accessToken;
          user.save(done);
        });
      });
    });
  }));

  /**
   * Serialize user data by _id
   */

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser((id, done) => Users.model.findById(id, done));

  return passport.initialize();
};

exports.session = function session() {
  return passport.session();
};

/**
 * Wrap authentification handler
 */

exports.authenticate = function authenticate() {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).redirect('/auth');
    }
  };
};

/**
 * Create basic authentification for test environments
 */

exports.basic = basic({
  users: {
    [process.env.BRFENERGI_USER]: process.env.BRFENERGI_PASS
  },
  challenge: true,
  realm: process.env.BRFENERGI_REALM
});

function addMeter(options) {
  return function (meter) {
    return new Promise((resolve, reject) => {
      request(Object.assign({}, options, {
        method: 'POST',
        uri: url.resolve(
          process.env.METRY_ENDPOINT_URL,
          `open_channels/${ METRY_OPEN_CHANNEL }/meters`
        ),
        body: { meter_id: meter._id }
      }), (err, response, body) => {
        if (err) { return reject(err); }
        if (body.code !== 200) { return reject(new Error(body.message)); }
        resolve();
      });
    });
  };
}

function updateMeters(cooperative, add = [], remove = []) {
  const meters = cooperative.meters.filter(meter => {
    return !remove.find(({ meterId }) => meter.meterId === meterId);
  }).concat(add.map(meter => ({ type: meter.type, meterId: meter._id })));

  return new Promise((resolve, reject) => {
    Cooperatives.update(cooperative._id, { meters }, err => {
      if (err) { return reject(err); }
      resolve();
    });
  });
}
