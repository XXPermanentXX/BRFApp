const html = require('choo/html');
const header = require('../components/page-head');

module.exports = function (state, emit) {
  return html`
    <div class="App">
      ${ header(state, emit) }
    </div>
  `;
};
