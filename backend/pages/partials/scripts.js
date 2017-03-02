const html = require('choo/html');

module.exports = function (state) {
  return [
    html`<script type="application/json" class="js-initialState">${ JSON.stringify(state) }</script>`,
    html`<script src="/index.js"></script>`
  ];
};
