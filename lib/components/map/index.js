const html = require('choo/html');
const map = require('./map');
const { loader } = require('../icons');
const { follow } = require('../utils');
const { __ } = require('../../locale');
const resolve = require('../../resolve');

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
      ${ !state.user.isAuthenticated ? html`
        <div class="Map-recruit">
          <div class="Map-recruitPanel">
            <div class="Type">
              <p>${ __('Missing your cooperative?') } <a href="${ resolve('/auth/metry') }" onclick=${ follow }>${ __('Add your cooperative') }</a></p>
            </div>
          </div>
          <div class="Map-recruitButton">
            <a href="${ resolve('/auth/metry') }" onclick=${ follow } class="Button u-block">
              ${ __('Add your cooperative') }
            </a>
          </div>
        </div>
      ` : null }
    </div>
  `;
};
