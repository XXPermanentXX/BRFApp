module.exports = function geoip(ip) {
  return (state, emitter) => {
    state.geoip = {};

    emitter.on('geoip:fetch', () => {
      fetch(`http://freegeoip.net/json/${ ip }`).then(
        body => body.json().then(data => {
          state.geoip = data;
          emitter.emit('render');
        }),
        err => emitter.emit('error', err)
      );
    });

    emitter.on('geoip:getPosition', () => {
      state.geoip.isLoading = true;
      emitter.emit('render');

      navigator.geolocation.getCurrentPosition(position => {
        state.geoip.latitude = position.coords.latitude;
        state.geoip.longitude = position.coords.longitude;
        state.geoip.isLoading = false;

        emitter.emit('render');
      }, err => emitter.emit('error', err));
    });
  };
};
