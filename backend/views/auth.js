const html = require('choo/html');
const header = require('../components/page-head');
const resolve = require('../resolve');
const { __ } = require('../locale');

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
      <a href=${ resolve('/auth/metry') } class="Button Button--primary">${ __('Sign in with Metry') }</a>
    </div>
  `;
};
