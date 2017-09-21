const Log = require('../models/logs');

module.exports = function error(err, req, res, next) {
  err.status = err.status || 500;
  res.status(err.status).render('/error', {
    error: {
      status: err.status || 500,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Error',
    type: 'fatal'
  });
};
