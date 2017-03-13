const html = require('choo/html');

exports.chevron = function chevron(direction) {
  const deg = {
    up: 90,
    right: 180,
    down: 270,
    left: 0
  };

  return html`
    <svg class="Icon">
      <use width="0.75em" height="0.75em" y="0.25em" class="Icon-path" xlink:href="#icon-chevron" transform="rotate(${ deg[direction] || 0 })" />
    </icon>
  `;
};

exports.loader = function loader() {
  return html`
    <svg class="Icon Icon--large Icon--center">
      <use class="Icon-path" xlink:href="#icon-loader" />
    </icon>
  `;
};
