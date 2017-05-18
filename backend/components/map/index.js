const html = require('choo/html');
const map = require('./map');
const { __ } = require('../../locale');
const { loader } = require('../icons');

module.exports = function (state, emit) {
  let center;
  const { cooperatives, user, geoip } = state;

  if (user.isAuthenticated) {
    const home = cooperatives.find(item => item._id === user.cooperative);
    center = home && { longitude: home.lng, latitude: home.lat };
  }

  if ((!center || geoip.precission === 'exact') && geoip.longitude) {
    center = {
      longitude: geoip.longitude,
      latitude: geoip.latitude,
      isLoading: geoip.isLoading,
      precission: geoip.precission
    };
  }

  return html`
    <div class="Map u-sizeFill u-flex u-flexCol u-flexJustifyCenter" onload=${ onload }>
      ${ center ? map(state.cooperatives.slice(), center) : loader() }
      <div class="Map-locate">
        <button class="Button Button--round u-textS" onclick=${ onclick } disabled=${ !!geoip.isLoading }>
          ${ __('Find me') }
        </button>
      </div>
    </div>
  `;

  function onclick() {
    emit('geoip:getPosition');
  }

  function onload() {
    if (!center) {
      emit('geoip:fetch');
    }
  }
};
