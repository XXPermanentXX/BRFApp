const html = require('choo/html');
const createMap = require('../components/map');
const header = require('../components/page-head');
const footer = require('../components/app/footer');
const { loader } = require('../components/icons');

const map = createMap();
let isInitialized = false;

module.exports = function (state, prev, send) {
  if (!isInitialized) {
    return html`
      <div class="App">
        <div class="u-flex u-flexCol u-fillViewportV">
          ${ header(state, prev, send) }
          <div class="u-flexGrow1 u-flex u-flexCol" onload=${ onload }>
            ${ loader() }
          </div>

          ${ footer(state, prev, send) }
        </div>
      </div>
    `;
  }

  return html`
    <div class="App">
      <div class="u-flex u-flexCol u-fillViewportV">
        ${ header(state, prev, send) }
        <div class="u-flexGrow1 u-flex u-flexCol">
          ${ map(state.cooperatives.items, state, send) }
        </div>

        ${ footer(state, prev, send) }
      </div>
    </div>
  `;

  function onload() {
    send('cooperatives:fetch');
    isInitialized = true;
  }
};
