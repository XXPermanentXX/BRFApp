const html = require('dedent');
const head = require('./partials/head');

module.exports = function app(view, state) {
  return html`
    <!doctype html>
    <html lang="${ state.lang }">
      ${ head(state) }
      ${ view(state) }
    </html>
  `;
};
