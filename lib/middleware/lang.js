module.exports = lang

function lang (language) {
  return function (ctx, next) {
    if (ctx.state.user) {
      // User defined language have precedence over Swedish (default)
      language = ctx.state.user.profile.language
    }

    const redirect = ctx.redirect
    ctx.redirect = function (pathname) {
      const prefix = language === 'sv' ? '' : `/${language}/`
      const url = (prefix + pathname).replace(/\/$/, '')
      return redirect.call(this, url)
    }

    ctx.state.lang = ctx.state.language = language

    return next()
  }
}
