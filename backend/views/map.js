const html = require('choo/html');
const createMap = require('../components/map');
const header = require('../components/page-head');
const footer = require('../components/app/footer');

const map = createMap();

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      <div class="u-flex u-flexCol u-fillViewportV">
        ${ header(state, prev, send) }
        <div class="u-flexGrow1 u-flex u-flexCol">
          ${ map(state.cooperatives.items, state, send) }
        </div>

        ${ footer(state, prev, send) }
      </div>
      <div class="App-container">
        <ul>
          ${ state.cooperatives.items.map(cooperative => html`
            <li>
              <a href="cooperatives/${ cooperative._id }">${ cooperative.name }</a>
            </li>
          `) }
        </ul>
      </div>
    </div>
  `;
};
