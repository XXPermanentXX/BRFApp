const got = require('got')

const DEBUG_IP = '130.237.227.33'

module.exports = middleware

async function middleware (ctx, next) {
  if (!ctx.accepts('html')) return next()
  const ip = process.env.NODE_ENV === 'development' || ctx.ip === '::1'
    ? DEBUG_IP
    : ctx.ip
  const url = `http://api.ipstack.com/${ip}?access_key=${process.env.IPSTACK_KEY}`
  const res = await got(url, { json: true })
  ctx.state.geoip = Object.assign({ precision: 'ip' }, res.body)
  return next()
}
