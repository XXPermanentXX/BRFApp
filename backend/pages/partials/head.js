const html = require('dedent');

module.exports = function (state) {
  return html`
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${ state.title ? state.title + ' | ' : '' }BRF Energi</title>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
      <link rel="manifest" href="/manifest.json">
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#388ee8">
      <meta name="apple-mobile-web-app-title" content="Brf Energi">
      <meta name="application-name" content="Brf Energi">
      <meta name="theme-color" content="#ffffff">
      <script>document.documentElement.classList.add('has-js');</script>
      <link rel="stylesheet" href="/index.css">
    </head>
  `;
};
