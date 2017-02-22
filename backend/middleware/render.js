const User = require('../models/users');

/**
 * Overwrite native `res.render` with one that conforms with request type and
 * decorates (HTML) state with user data
 */

module.exports = function render(req, res, next) {
  const orig = res.render;

  res.render = function (route, state, format) {
    if (route && req.accepts('html')) {

      /**
       * Pipe given state through (optional) format function before sending
       */

      if (typeof format === 'function') {
        format(state, (err, formated) => {
          if (err) {
            res.status(500).render('/error', {
              err: err.message
            });
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
            orig.call(res, route, Object.assign({
              user
            }, state));
          }
        });
      } else {
        orig.call(res, route, Object.assign({
          'user': {
            '_id': '560bef1de0d64de648ae2538',
            'cooperativeId': '5638c9656579012957b5e273',
            'email': 'hannaha@kth.se',
            'metryId': '57dbc0e5637e2562008b463a',
            'accessToken': '40ef4afd1a0ce0586b846d20ec0b1cbd723cbb19',
            'profile': {
              'name': 'Hanna Hasselqvist',
              'toRehearse': {
                'setByUser': true,
                'na': true,
                'declined': true,
                'done': true
              },
              'language': 'sv'
            },
            'cooperative': {
              'name': 'Brf Älven',
              '_id': '5638c9656579012957b5e273'
            }
          }
        }, state));
      }
    }
  };

  next();
};
