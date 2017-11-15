const dedent = require('dedent')
const express = require('express')

const router = module.exports = express.Router()

router.get('/robots.txt', function (req, res, next) {
  res.type('text')
  res.send(dedent`
    User-agent: *
    Disallow: /
  `)
})
