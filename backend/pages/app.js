const html = require('dedent');
const head = require('./partials/head');
const scripts = require('./partials/scripts');
const symbols = require('../components/icons/symbols');

module.exports = function app(view, state) {
  return html`
    <!doctype html>
    <html lang="${ state.lang }">
      ${ head(state) }
      <body>
        <div class="js-static" style="height: 100%;">
          ${ view(state) }
        </div>
        ${ symbols() }
        ${ scripts(state).join('\n') }
      </body>
    </html>
  `;
};
