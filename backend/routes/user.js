const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Log = require('../models/logs');

router.post('/', (req, res) => {
  req.checkBody('cooperative', 'Invalid cooperative id').isMongoId();

  const err = req.validationErrors();

  if (err) {
    res.status(400).render('/error', { err: err.message });
  } else {
    Users.create(req.body, err => {
      if (err) {
        return res.status(500).render('/error', { err: err.message });
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

router.get('/', auth.authenticate(), function (req, res) {
  Users.getProfile(req.user._id, (err, profile) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      res.render('/user', profile);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Own User Profile',
    type: 'get'
  });
});

module.exports = router;
