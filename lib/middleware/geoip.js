let got
import('got').then(gotModule => {
  got = gotModule.default
}).catch(err => console.error('Failed to load the got module', err))

module.exports = middleware

async function middleware (ctx, next) {
  if (!ctx.accepts('html')) return next()
  const ip = await resolveIP(ctx.ip)
  const url = `http://api.ipstack.com/${ip}?access_key=${process.env.IPSTACK_KEY}`
  const body = await got(url).json();
  ctx.state.geoip = body.error ? {} : body
  return next()
}

async function resolveIP (ip) {
  ip = ip.replace(/^::ffff:/, '')
  if (ip === '::1' || ip.startsWith('172')) {
    // local develoment
    try {
      // try and resolve actual IP
      const { body } = await got('https://ifconfig.me/ip')
      return body
    } catch (err) {
      // fallback to some arbitary IP
      return '185.122.168.227'
    }
  }
  // remove IPv4 prefix
  return ip
}
