const html = require('choo/html');
const head = require('./partials/head');
const scripts = require('./partials/scripts');
const header = require('../components/page-head');

module.exports = function (state, prev, send) {
  return html`
    <html lang="${ state.lang }">
      ${ head(state) }
      <body>
        ${ header(state, prev, send) }
        <a href="/auth/metry" class="Button Button--primary">Sign in with Metry</a>
        <pre>${ JSON.stringify(state, null, 2) }</pre>
        ${ scripts(state) }
      </body>
    </html>
  `;
};
