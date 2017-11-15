const debounce = require('lodash.debounce')
const { vw } = require('../../components/utils')

module.exports = function chart () {
  let hasChanged = false
  const cache = {}

  return (state, emitter) => {
    state.chart = {
      inEdit: typeof window !== 'undefined' && vw() >= 800,
      page: 0
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', debounce(() => {
        if (hasChanged) { return }

        const inEdit = vw() >= 800
        if (state.chart.inEdit !== inEdit) {
          state.chart.inEdit = inEdit
          emitter.emit('render')
        }
      }, 250))
    }

    emitter.on(state.events.NAVIGATE, () => {
      hasChanged = false
      cache[state.href] = { page: state.chart.page }
      Object.assign(state.chart, {
        page: 0,
        inEdit: vw() >= 800
      }, cache[window.location.pathname])
    })

    emitter.on('chart:edit', () => {
      hasChanged = true
      state.chart.inEdit = true
      emitter.emit('render')
    })

    emitter.on('chart:paginate', diff => {
      state.chart.page += diff
      emitter.emit('render')
    })
  }
}
