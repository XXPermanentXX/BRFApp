const html = require('choo/html');
const { __, __n } = require('../../locale');
const resolve = require('../../resolve');
const {
  energyRepresentative,
  energyMap,
  target,
  lightChallenge,
  electricCar,
  solarPanel
} = require('../icons');

module.exports = function popup(feature) {
  const { properties: props } = feature;

  return html`
    <div class="Map-popup">
      <div class="u-nbfc">
        <a class="u-textBold" href=${ resolve(`/cooperatives/${ props._id }`) }>
          ${ props.name }
        </a>
        ${ props.performance ?
          html`
            <div>
              <span class="u-textBold">${ Math.round(props.performance) }</span> kWh/m<sup>2</sup>
            </div>
          ` :
          html`
            <div>
              <em class="u-colorDim">${ __('No consumtion data') }</em>
            </div>
          `
        }
        ${ props.actions.length ?
          html`
            <span>
              <span class="u-textBold">${ props.actions.length }</span>
              ${ ' ' + __n('Energy action', 'Energy actions', props.actions.length) }
            </span>
          ` :
          html`<em class="u-colorDim">${ __('No energy actions') }</span>`
        }
        <br />
        <div class="u-nbfc u-marginTb">
          ${
            [
              [ 'hasCharger', __('Charger for electric cars'), electricCar(22) ],
              [ 'hasEnergyProduction', __('Renewable energy production'), solarPanel(22) ],
              [ 'hasRepresentative', __('Assigned energy representative'), energyRepresentative(22) ],
              [ 'hasConsumptionMapping', __('Energy consumption mapping'), energyMap(22) ],
              [ 'hasGoalManagement', __('Goal oriented energy management'), target(22) ],
              [ 'hasBelysningsutmaningen', __('Part of belysningsutmaningen'), lightChallenge(22) ]
            ].map(([ prop, label, icon ]) => html`
              <div class="u-floatLeft u-marginRb" style="color: ${ props[prop] ? 'currentColor' : '#bbbbbb' };" title=${ label }>${ icon }</div>
            `)
          }
        </div>
      </div>
    </div>
  `;
};
