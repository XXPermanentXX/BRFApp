const html = require('choo/html');
const app = require('../components/app');
const { __ } = require('../locale');

module.exports = app(view, title);

function view(state, emit) {
  return html`
    <h1>Oops!</h1>
  `;
}

function title() {
  return __('An error has occured');
}
