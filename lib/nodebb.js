const got = require('got')
const util = require('util')
const { URL } = require('url')
const jwt = require('jsonwebtoken')
const encryptor = require('simple-encryptor')(process.env.URL_ENCRYPTION_KEY)

const SECURE_KEY = process.env.BRFENERGI_SESSION_SECRET
const signToken = util.promisify(jwt.sign)
const verifyToken = util.promisify(jwt.verify)

exports.encode = encode
function encode (props) {
  const msg = encryptor.encrypt(props)
  const jwtOptions = { expiresIn: '1h' }
  return signToken({ msg }, SECURE_KEY, jwtOptions)
}

exports.verify = verify
function verify (token) {
  return verifyToken(token, SECURE_KEY)
}

exports.authenticate = async function authenticate (token) {
  const { href } = new URL('auth/faux', process.env.FORUM_URL)
  const res = await got(href + '?token=' + token, { json: true })
  return res.body
}
