const html = require('choo/html');
const app = require('../components/app');

module.exports = app(view, title);

function view(state, emit) {
  return html`
    <pre>
      ${ JSON.stringify(state.user, null, 2) }
    </pre>
  `;
}

function title(state) {
  return state.user.name;
}
