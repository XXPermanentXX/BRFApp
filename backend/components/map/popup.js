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

const INITIATIVES = [
  [ 'hasCharger', __('Electric car charger'), electricCar(22) ],
  [ 'hasEnergyProduction', __('Energy production'), solarPanel(22) ],
  [ 'hasRepresentative', __('Energy representative'), energyRepresentative(22) ],
  [ 'hasConsumptionMapping', __('Consumption mapping'), energyMap(22) ],
  [ 'hasGoalManagement', __('Energy management'), target(22) ],
  [ 'hasBelysningsutmaningen', __('Belysningsutmaningen'), lightChallenge(22) ]
];

module.exports = function popup(feature) {
  const { properties: props } = feature;

  // Mapbox casts nested json objects to string
  const actions = JSON.parse(props.actions);

  const completedInitiatives = INITIATIVES.reduce((total, [prop]) => {
    return total + (props[prop] ? 1 : 0);
  }, 0);

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
        ${ actions.length ?
          html`
            <span>
              <span class="u-textBold">${ actions.length }</span>
              ${ ' ' + __n('Energy action', 'Energy actions', actions.length) }
            </span>
          ` :
          html`<em class="u-colorDim">${ __('No energy actions') }</span>`
        }
        <div class="Map-coopProps">
          ${ INITIATIVES.map(([ prop, label, icon ]) => html`
            <div class="Map-coopProp u-color${ props[prop] ? 'Current' : 'Pale' }" data-title=${ label }>${ icon }</div>
          `) }
          <span class="Map-propsSum">
            ${ completedInitiatives } / ${ INITIATIVES.length } ${ __n('Initiative', 'Initiatives', completedInitiatives).toLowerCase() }
          </span>
        </div>
      </div>
    </div>
  `;
};
