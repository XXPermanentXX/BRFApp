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


const UNKNOWN_ENERGY_CLASS = '#bbbbbb';
const ENERGY_CLASSES = {
  A: '#009036',
  B: '#55AB26',
  C: '#C8D200',
  D: '#FFED00',
  E: '#FBBA00',
  F: '#EB6909',
  G: '#E2001A'
};

exports.energyClass = function energyClass(key, size = 19) {
  return html`
    <svg class="Icon" style="width: ${ size }px; height: ${ size }px; color: ${ ENERGY_CLASSES[key.toUpperCase()] || UNKNOWN_ENERGY_CLASS };">
      <use class="Icon-path" xlink:href="#icon-energyClass" />
    </icon>
  `;
};

exports.energyRepresentative = function energyRepresentative(size = 18) {
  return html`
    <svg class="Icon" style="width: ${ size }; height: ${ size };">
      <use class="Icon-path" xlink:href="#icon-energyRepresentative" />
    </icon>
  `;
};

exports.energyMap = function energyMap(size = 18) {
  return html`
    <svg class="Icon" style="width: ${ size }; height: ${ size };">
      <use class="Icon-path" xlink:href="#icon-energyMap" />
    </icon>
  `;
};

exports.target = function target(size = 18) {
  return html`
    <svg class="Icon" style="width: ${ size }; height: ${ size };">
      <use class="Icon-path" xlink:href="#icon-target" />
    </icon>
  `;
};

exports.lightChallenge = function lightChallenge(size = 18) {
  return html`
    <svg class="Icon" style="width: ${ size }; height: ${ size };">
      <use class="Icon-path" xlink:href="#icon-lightChallenge" />
    </icon>
  `;
};
