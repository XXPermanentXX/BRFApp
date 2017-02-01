const auth = require('./auth');

/**
 * Overwrite native `res.render` with one that conforms with request type and
 * decorates HTML state with user data
 */

module.exports = function render(req, res, next) {
  const orig = res.render;

  res.render = function (route, state) {
    if (route && req.accepts('html')) {
      orig.call(this, route, Object.assign({ user: req.user }, state));
    } else {
      res.json(state);
    }
  };

  next();
};
