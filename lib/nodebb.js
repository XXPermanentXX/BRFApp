const got = require('got')
const util = require('util')
const { URL } = require('url')
const jwt = require('jsonwebtoken')

const SECURE_KEY = process.env.BRFENERGI_SESSION_SECRET
const signToken = util.promisify(jwt.sign)
const verifyToken = util.promisify(jwt.verify)

exports.encode = encode
function encode (props) {
  const opts = { expiresIn: '1h' }
  return signToken(props, SECURE_KEY, opts)
}

exports.verify = verify
function verify (token) {
  return verifyToken(token, SECURE_KEY)
}

exports.authenticate = authenticate
async function authenticate (data) {
  const opts = { json: true, method: 'POST', body: data }
  const endpoint = url.resolve('http://forum:4567', 'api/brfauth/uid')
  const res = await got(endpoint, opts)
  return res.body
}

exports.touch = touch
async function touch (token) {
  const opts = { json: true, method: 'POST', body: { token } }
  const endpoint = url.resolve('http://forum:4567', 'api/brftouch')
  const res = await got(endpoint, opts)
  return res.body
}

exports.register = register
async function register (token) {
  const opts = { json: true, method: 'POST', body: { token } }
  const endpoint = url.resolve('http://forum:4567', 'api/v2/users')
  const res = await got(endpoint, opts)
  return res.body
}
