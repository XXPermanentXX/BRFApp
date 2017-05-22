const html = require('choo/html');
const map = require('../components/map');
const modal = require('../components/modal');
const header = require('../components/page-head')('map');
const footer = require('../components/app/footer');
const error = require('../components/app/error');
const onboarding = require('../components/onboarding');

module.exports = function view(state, emit) {
  return html`
    <div class="App">
      <div class="u-flex u-flexCol u-fillViewportV">
        ${ error(state, emit) }
        ${ header(state, emit) }
        <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter">
          ${ map(state, emit) }
        </div>

        ${ footer(state, emit) }
      </div>

      ${ state.user.hasBoarded ? null : modal(
        onboarding(state.onboarding, modal.close),
        () => emit('user:boarded')
      ) }
    </div>
  `;
};
