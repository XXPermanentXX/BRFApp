const html = require('choo/html');
const map = require('../components/map');
const header = require('../components/page-head');
const footer = require('../components/app/footer');
const error = require('../components/app/error');
const { loader } = require('../components/icons');

let isInitialized = false;

module.exports = function (state, emit) {
  return html`
    <div class="App">
      <div class="u-flex u-flexCol u-fillViewportV">
        ${ error(state, emit) }
        ${ header(state, emit) }
        <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter" onload=${ onload }>
          ${ isInitialized ? map(state, emit) : loader() }
        </div>

        ${ footer(state, emit) }
      </div>
    </div>
  `;

  function onload() {
    if (!isInitialized) {
      emit('cooperatives:fetch');
      isInitialized = true;
    }
  }
};
