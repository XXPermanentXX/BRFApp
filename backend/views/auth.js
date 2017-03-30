const html = require('choo/html');
const header = require('../components/page-head');
const resolve = require('../resolve');
const { __ } = require('../locale');

module.exports = function (state, emit) {
  return html`
    <div class="App">
      ${ header(state, emit) }
      <a href=${ resolve('/auth/metry') } data-no-routing="true" class="Button Button--primary">${ __('Sign in with Metry') }</a>
    </div>
  `;
};
