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
      if (req.user) {
        User.getProfile(req.user._id, (err, user) => {
          if (err) {
            res.status(500).render('/error', {
              err: err.message
            });
          } else {
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
