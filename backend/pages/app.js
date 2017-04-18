const dedent = require('dedent');
const head = require('./partials/head');
const scripts = require('./partials/scripts');
const symbols = require('../components/icons/symbols');

module.exports = function app(view, state, prev, send) {
  return dedent`
    <!doctype html>
    <html lang="${ state.lang }">
      ${ head(state) }
      <body>
        <div class="js-app">
          ${ view(state, prev, send) }
        </div>
        ${ symbols() }
        ${ scripts(state).join('\n') }
      </body>
    </html>
  `;
};
