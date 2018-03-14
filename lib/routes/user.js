const express = require('express')
const Log = require('../models/logs')
const Users = require('../models/users')
const auth = require('../middleware/auth')

const router = module.exports = express.Router()

router.put('/:id', isCurrentUser('id'), (req, res, next) => {
  Users
    .update(req.params.id, req.body)
    .then(user => res.render('/user', user), next)
})

router.get('/', auth.authenticate(), (req, res, next) => {
  Users.get(req.user._id).then(user => res.render('/user', user), next)

  Log.create({
    userId: req.user._id,
    category: 'Own User Profile',
    type: 'get'
  })
})

function isCurrentUser (prop) {
  return function (req, res, next) {
    auth.authenticate()(req, res, () => {
      if (!req.user || req.user._id.toString() !== req.params[prop]) {
        res.status(401).redirect('/auth')
      } else {
        next()
      }
    })
  }
}
