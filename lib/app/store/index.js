const content = require('./content')
const error = require('./error')
const user = require('./user')
const actions = require('./actions')
const cooperatives = require('./cooperatives')
const consumptions = require('./consumptions')
const tracking = require('./tracking')

module.exports = function () {
  return function (state, emitter) {
    let anchor = null
    emitter.on('scrollto', function (id, opts) {
      window.setTimeout(function () {
        if (id === anchor) return

        const el = document.getElementById(id)
        if (!el) return

        el.scrollIntoView(Object.assign({
          behavior: 'smooth',
          block: 'start'
        }, opts))
      }, 0)
    })

    emitter.on(state.events.NAVIGATE, function () {
      if (anchor) {
        const el = document.getElementById(anchor)
        if (el) el.scrollIntoView(true)
        else anchor = null
      } else {
        document.body.scrollIntoView(true)
      }
    })

    /**
     * Initialize all state models with their respective initial state
     */

    const stores = [
      content(),
      error(),
      user(),
      actions(),
      cooperatives(),
      consumptions(),
      tracking()
    ]
    stores.forEach(model => model(state, emitter))
  }
}
