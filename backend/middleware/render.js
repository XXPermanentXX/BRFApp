const User = require('../models/users');

/**
 * Overwrite native `res.render` with one that conforms with request type and
 * decorates (HTML) state with user data
 */

module.exports = function render(req, res, next) {
  const orig = res.render;

  res.render = function (route, state, formatter) {
    if (typeof route === 'object' && !state) {
      state = route;
    }

    /**
     * Determine format of return value -> HTML/JSON
     */

    if (typeof route === 'string' && req.accepts('html')) {

      /**
       * Pipe state through (optional) formatter for decorating HTML state
       */

      if (typeof formatter === 'function') {
        formatter((err, formatted) => {
          if (err) {
            res.status(500).render('/error', { err: err.message });
          } else {
            send(formatted);
          }
        });
      } else {
        send(state || {});
      }
    } else {
      res.json(state);
    }

    /**
     * Decorate state with user data before passing it to the render method
     * @param  {Object} state State object to be decorated
     */

    function send(state) {
      // Ensure state consistency
      state.geoip = {};
      state.consumptions = {};
      state.actions = state.actions || [];
      state.cooperatives = state.cooperatives || [];
      state.auth = req.get('Authorization');

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
    }
  };

  next();
};
