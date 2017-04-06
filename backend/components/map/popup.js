const html = require('choo/html');
const { __, __n } = require('../../locale');
const {
  energyRepresentative,
  energyMap,
  target,
  lightChallenge,
  electricCar
} = require('../icons');

module.exports = function popup(feature) {
  const { properties } = feature;

  return html`
    <div class="Map-popup">
      <div class="u-nbfc">
        <a class="u-textBold" href="/cooperatives/${ properties.id }">
          ${ properties.name }
        </a>
        ${ properties.performance ?
          html`
            <div>
              <span class="u-textBold">${ Math.round(properties.performance) }</span> kWh/m<sup>2</sup>
            </div>
          ` :
          html`
            <div>
              <em class="u-colorDim">${ __('No consumtion data') }</em>
            </div>
          `
        }
        ${ properties.actions ?
          html`
            <span>
              <span class="u-textBold">${ properties.actions }</span>
              ${ __n('Energy action', 'Energy actions', properties.actions) }
            </span>
          ` :
          html`<em class="u-colorDim">${ __('No energy actions') }</span>`
        }
        <br />
        <div class="u-nbfc u-marginTb">
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Designated Energyrepresentative') }>${ energyRepresentative(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Energy mapping') }>${ energyMap(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Contract for goal oriented energy management') }>${ target(22) }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Participating in belysningsutmaningen') }>${ lightChallenge(22)  }</div>
          <div class="u-floatLeft u-marginRb" style="color: ${ Math.random() > 0.5 ? '#bbbbbb' : 'currentColor' };" title=${ __('Charger for electric cars') }>${ electricCar(22)  }</div>
        </div>
      </div>
    </div>
  `;
};
