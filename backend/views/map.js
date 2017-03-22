const html = require('choo/html');
const header = require('../components/page-head');

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
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
