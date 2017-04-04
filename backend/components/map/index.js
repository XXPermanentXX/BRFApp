const html = require('choo/html');
const createMap = require('./container');
const { __ } = require('../../locale');
const { loader } = require('../icons');

const container = createMap();

module.exports = function map(state, emit) {
  let center;
  const { cooperatives, user, geoip } = state;

  if (user) {
    const home = cooperatives.find(item => item._id === user.cooperative);
    center = home && { longitude: home.lng, latitude: home.lat };
  }

  if (!center && geoip.longitude) {
    center = {
      longitude: geoip.longitude,
      latitude: geoip.latitude,
      isLoading: geoip.isLoading
    };
  }

  return html`
    <div class="Map u-sizeFill u-flex u-flexCol u-flexJustifyCenter" onload=${ onload }>
      ${ center ? container(state.cooperatives.slice(), center) : loader() }
      <div class="Map-locate">
        <button class="Button Button--round u-textS" onclick=${ onclick } disabled=${ !!geoip.isLoading }>
          ${ __('Show closest') }
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
