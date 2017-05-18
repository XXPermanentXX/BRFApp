module.exports = function scrips(state) {
  const tags = [
    `<script type="application/json" class="js-initialState">${ JSON.stringify(state) }</script>`,
    '<script src="/index.js" async></script>'
  ];

  tags.unshift('<script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default,fetch,Array.prototype.includes,Object.values"></script>');

  return tags;
};
