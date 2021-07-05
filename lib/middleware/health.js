module.exports = health

function health (ctx, next) {
  const userAgent = ctx.headers['user-agent']
  const isBot = userAgent && userAgent.includes('UptimeRobot')
  if (ctx.url !== '/_health' && !isBot) return next()
  ctx.status = 200
  ctx.body = 'OK'
}
