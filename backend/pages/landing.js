const dedent = require('dedent');
const head = require('./partials/head');
const scripts = require('./partials/scripts');

module.exports = function (view, state, prev, send) {
  return dedent`
    <!doctype html>
    <html lang="${ state.lang }">
      ${ head(state) }
      <body>
        ${ view(state, prev, send) }
        <pre>${ JSON.stringify(state, null, 2) }</pre>
        ${ scripts(state) }
      </body>
    </html>
  `;
};
