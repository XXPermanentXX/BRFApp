const html = require('choo/html');
const app = require('../components/app');
const { __ } = require('../locale');

module.exports = app(view, title);

function view(state, emit) {
  return html`
    <div>hello?</div>
  `;
}

function title() {
  return __('Actions');
}
