const html = require('choo/html');

module.exports = function scrips(state) {
  const tags = [
    html`<script src=${ process.env.MAPBOX_CDN_JS }></script>`,
    html`<script type="application/json" class="js-initialState">${ JSON.stringify(state) }</script>`,
    html`<script src="/index.js" async></script>`
  ];

  if (process.env.NODE_ENV !== 'development') {
    tags.unshift(html`<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch"></script>`);
  }

  return tags;
};
