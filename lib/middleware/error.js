const Log = require('../models/logs')
const { __, setLocale } = require('../locale')

module.exports = error

const DEFAULT_LANGUAGE = 'sv'

async function error (ctx, next) {
  try {
    ctx.state.error = null
    await next()
  } catch (err) {
    if (ctx.accepts('html')) {
      ctx.state.status = err.status || err.statusCode || 500
      if (err.status === 401) {
        ctx.redirect('/auth')
      } else {
        setLocale(ctx.state.user ? ctx.state.user.profile.language : DEFAULT_LANGUAGE)
        ctx.state.error = {
          message: __(err.message),
          status: ctx.state.status,
          stack: err.stack
        }
      }
    }

    Log.create({
      userId: ctx.state.user && ctx.state.user._id,
      category: 'Error',
      type: 'server',
      data: err.message
    })

    if (!ctx.accepts('html')) ctx.throw(err)
  }
}
