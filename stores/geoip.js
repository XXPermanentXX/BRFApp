module.exports = geoip

function geoip (state, emitter) {
  state.geoip = state.geoip || {
    longitude: 18.05,
    latitude: 59.3333,
    precision: 'city'
  }
  state.geoip.isLoading = false

  emitter.on('geoip:getPosition', () => {
    state.geoip.isLoading = true
    emitter.emit('render')

    navigator.geolocation.getCurrentPosition(position => {
      state.geoip.latitude = position.coords.latitude
      state.geoip.longitude = position.coords.longitude
      state.geoip.precision = 'exact'
      state.geoip.isLoading = false
      emitter.emit('render')
    }, err => {
      state.geoip.isLoading = false
      emitter.emit('error', err)
    })
  })
}
