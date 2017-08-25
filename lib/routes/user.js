const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Log = require('../models/logs');

router.post('/', (req, res) => {
  req.checkBody('cooperative', 'Invalid cooperative id').isMongoId();

  const err = req.validationErrors();

  if (err) {
    res.status(400).render('/error', { error: err.message });
  } else {
    Users.create(req.body, err => {
      if (err) {
        return res.status(500).render('/error', { error: err.message });
      } else {
        res.redirect(`/cooperative/${ req.body.cooperative }`);
      }
    });
  }

  Log.create({
    category: 'Register User',
    type: 'create',
    data: req.body
  });
});

router.put('/:id', isCurrentUser('id'), (req, res) => {
  Users.update(req.params.id, req.body, (err, user) => {
    if (err) {
      res.status(404).render('/404', { error: err.message });
    } else {
      res.render('/user', user);
    }
  });
}),

router.get('/', auth.authenticate(), (req, res) => {
  Users.get(req.user._id, (err, user) => {
    if (err) {
      res.status(404).render('/404', { error: err.message });
    } else {
      res.render('/user', user);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Own User Profile',
    type: 'get'
  });
});

function isCurrentUser(prop) {
  return function (req, res, next) {
    auth.authenticate()(req, res, () => {
      if (!req.user || req.user._id.toString() !== req.params[prop]) {
        res.status(401).redirect('/auth');
      } else {
        next();
      }
    });
  };
}

module.exports = router;
