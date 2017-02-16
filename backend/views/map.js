const html = require('choo/html');
const header = require('../components/page-head');

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
    </div>
  `;
};
