const html = require('choo/html');
const header = require('../components/page-head');
const resolve = require('../resolve');
const { __ } = require('../locale');

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
      <a href=${ resolve('/auth/metry') } data-no-routing="true" class="Button Button--primary">${ __('Sign in with Metry') }</a>
    </div>
  `;
};
