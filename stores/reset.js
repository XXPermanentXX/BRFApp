module.exports = reset

function reset (state, emitter) {
  state.language = process.env.BRFENERGI_LANG
}
