const html = require('choo/html');
const app = require('../components/app');
const map = require('../components/map');
const popup = require('../components/map/popup');
const modal = require('../components/modal');
const onboarding = require('../components/onboarding');
const { getEnergyClass, getPerformance } = require('../components/utils');
const { __ } = require('../locale');

module.exports = app(view, title);

function view(state, emit) {
  return html`
    <div class="u-flex u-flexGrow1">
      <div class="App-container App-container--lg u-hiddenHasScript">
        <ul class="Map u-flex u-flexWrap">
          ${ state.cooperatives.map(cooperative => {
            const { value: performance } = getPerformance(cooperative) || {};

            return html`
              <li class="Sheet u-paddingAs u-marginAb">
                ${ popup({
                  properties: Object.assign({
                    flat: true,
                    performance: performance,
                    energyClass: (getEnergyClass(performance) || 'unknown').toLowerCase()
                  }, cooperative)
                }) }
              </li>
            `;
          }) }
        </ul>
      </div>

      <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter u-hiddenNoScript">
        ${ map(state, emit) }
      </div>

      ${ state.user.hasBoarded ? null : modal(
        onboarding(state, modal.close),
        () => emit('user:boarded')
      ) }
    </div>
  `;
}

function title() {
  return __('Welcome');
}
