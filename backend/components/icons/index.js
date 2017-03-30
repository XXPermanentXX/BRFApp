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

exports.electricCar = function electricCar(size = 18) {
  return html`
    <svg class="Icon" style="width: ${ size }; height: ${ size };">
      <use class="Icon-path" xlink:href="#icon-electricCar" />
    </icon>
  `;
};
