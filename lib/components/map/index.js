const html = require('choo/html');
const map = require('./map');
const { loader } = require('../icons');
const { __ } = require('../../locale');

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

  if (typeof window !== 'undefined' && !center) {
    emit('geoip:fetch');
  }

  return html`
    <div class="Map u-sizeFill u-flex u-flexCol u-flexJustifyCenter">
      ${ center ? map(state.cooperatives.slice(), center) : html`
        <div class="u-colorSky u-flex u-flexJustifyCenter">
          ${ loader() }
        </div>
      ` }

      <div class="Map-locate">
        <button class="Button Button--round u-textS" onclick=${ () => emit('geoip:getPosition') } disabled=${ !!geoip.isLoading }>
          ${ __('Find me') }
        </button>
      </div>
    </div>
  `;
};
