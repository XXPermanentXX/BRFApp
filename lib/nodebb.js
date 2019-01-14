const url = require('url')
const got = require('got')
const util = require('util')
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
  const opts = { json: true }
  if (process.env.BRFENERGI_USER && process.env.BRFENERGI_PASS) {
    const buff = Buffer.from([
      process.env.BRFENERGI_USER,
      process.env.BRFENERGI_PASS
    ].join(':'))
    opts.headers = { 'Authorization': 'Basic ' + buff.toString('base64') }
  }
  const endpoint = url.resolve(process.env.FORUM_URL, 'auth/faux')
  const res = await got(endpoint + '?token=' + token, opts)
  return res.body
}
