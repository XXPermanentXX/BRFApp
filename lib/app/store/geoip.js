module.exports = function geoip(ip) {
  return (state, emitter) => {
    state.geoip = { ip };

    emitter.on('geoip:fetch', () => {
      fetch('//api.ipify.org?format=json')
        .then(body => body.json())
        .then(resp => fetch(`//freegeoip.net/json/${ resp.ip }`))
        .then(body => body.json())
        .then(data => {
          Object.assign(state.geoip, data, { precission: 'city' });
          emitter.emit('render');
        }, err => emitter.emit('error', err));
    });

    emitter.on('geoip:getPosition', () => {
      const { geoip } = state;

      geoip.isLoading = true;
      emitter.emit('render');

      navigator.geolocation.getCurrentPosition(position => {
        geoip.latitude = position.coords.latitude;
        geoip.longitude = position.coords.longitude;
        geoip.precission = 'exact';
        geoip.isLoading = false;

        emitter.emit('render');
      }, err => emitter.emit('error', err));
    });
  };
};
