const User = require('../models/users');

/**
 * Overwrite native `res.render` with one that conforms with request type and
 * decorates (HTML) state with user data
 */

module.exports = function render(req, res, next) {
  const orig = res.render;

  res.render = function (route, state, format) {
    if (typeof route === 'object' && !state) {
      state = route;
    }

    if (typeof route === 'string' && req.accepts('html')) {
      state = state || {};

      /**
       * Pipe given state through (optional) format function before sending
       */

      if (typeof format === 'function') {
        format(state, (err, formated) => {
          if (err) {
            res.status(500).render('/error', { err: err.message });
          } else {
            send(formated);
          }
        });
      } else {
        send(state);
      }
    } else {

      /**
       * If it's not specifically HTML that is beeing request, just send json
       */

      res.json(state);
    }

    /**
     * Decorate state with user data before passing it to the render method
     * @param  {Object} state State object to be decorated
     */

    function send(state) {
      let geoip;

      // Ensure actions in state
      state.actions = state.actions || [];
      state.cooperatives = state.cooperatives || [];

      // Expose client ip for geolocation
      if (process.env.NODE_ENV === 'development') {
        geoip = require('public-ip').v4();
      } else {
        geoip = Promise.resolve(req.ip);
      }

      geoip.then(ip => {
        state.ip = ip;

        if (req.user) {
          User.getProfile(req.user._id, (err, user) => {
            if (err) {
              res.status(500).render('/error', { err: err.message });
            } else {
              const cooperatives = state.cooperatives;
              const id = user.cooperative.toString();

              if (!cooperatives.find(props => props._id.toString() === id)) {
                cooperatives.push(user.cooperative);
              }

              orig.call(res, route, Object.assign({ user }, state));
            }
          });
        } else {
          orig.call(res, route, state);
        }
      });
    }
  };

  next();
};
