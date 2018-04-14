const app = require('../components/app')
const views = {
  '404': require('../components/app/404'),
  '500': require('../components/app/500')
}

module.exports = function view (state, emit) {
  return app(error, title)(state, emit)

  function error (state, emit) {
    const status = (state.error && state.error.status) || '404'
    if (status in views) {
      return views[status](state.error || new Error('Page not found'))
    } else {
      return views['500'](state.error)
    }
  }

  function title () {
    const status = (state.error && state.error.status) || '404'
    if (status in views) {
      return views[status].title()
    } else {
      return views['500'].title()
    }
  }
}
