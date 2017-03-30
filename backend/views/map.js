const html = require('choo/html');
const createMap = require('../components/map');
const header = require('../components/page-head');
const footer = require('../components/app/footer');
const { loader } = require('../components/icons');

const map = createMap();
let isInitialized = false;

module.exports = function (state, emit) {
  if (!isInitialized) {
    return html`
      <div class="App">
        <div class="u-flex u-flexCol u-fillViewportV">
          ${ header(state, emit) }
          <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter" onload=${ onload }>
            ${ loader() }
          </div>

          ${ footer(state, emit) }
        </div>
      </div>
    `;
  }

  return html`
    <div class="App">
      <div class="u-flex u-flexCol u-fillViewportV">
        ${ header(state, emit) }
        <div class="u-flexGrow1 u-flex u-flexCol">
          ${ map(state.cooperatives.items, state, emit) }
        </div>

        ${ footer(state, emit) }
      </div>
    </div>
  `;

  function onload() {
    emit('cooperatives:fetch');
    isInitialized = true;
  }
};
