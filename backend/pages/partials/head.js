const html = require('choo/html');

module.exports = function (state) {
  return html`
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${ state.title && state.title + ' | ' }BRF Energi</title>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v0.34.0/mapbox-gl.css" />
      <link rel="stylesheet" href="/index.css">
    </head>
  `;
};
