const html = require('choo/html');
const header = require('../components/page-head')('cooperative');
const performance = require('../components/performance');
const createChart = require('../components/chart');
const modal = require('../components/modal');
const { definition, numbered } = require('../components/list');
const { format } = require('../components/utils');
const { summary } = require('../components/action');
const { chevron, loader } = require('../components/icons');
const error = require('../components/app/error');
const footer = require('../components/app/footer');
const onboarding = require('../components/onboarding');
const icons = require('../components/icons');
const { __, __n } = require('../locale');
const resolve = require('../resolve');

const chart = createChart();

const INITIATIVES = [
  [ 'hasLaundryRoom', __('Shared laundry room'), icons.laundry(26) ],
  [ 'hasGarage', __('Garage'), icons.garage(26) ],
  [ 'hasCharger', __('Electric car charger'), icons.electricCar(26) ],
  [ 'hasEnergyProduction', __('Renewable energy production'), icons.solarPanel(26) ],
  [ 'hasRepresentative', __('Designated Energyrepresentative'), icons.energyRepresentative(26) ],
  [ 'hasConsumptionMapping', __('Energy consumption mapping'), icons.energyMap(26) ],
  [ 'hasGoalManagement', __('Goal oriented energy management'), icons.target(26) ],
  [ 'hasBelysningsutmaningen', __('Part of belysningsutmaningen'), icons.lightChallenge(26) ]
];

module.exports = view;

function view(state, emit) {
  const { cooperative: id } = state.params;
  const cooperative = state.cooperatives.find(props => props._id === id);
  const actions = state.actions.filter(props => props.cooperative === id);

  if (!cooperative) {
    return html`
      <div class="App" onload=${ () => emit('cooperatives:fetch', id) }>
        ${ error(state, emit) }
        ${ header(state, emit) }
        <div class="App-container u-paddingVb u-flex u-flexCol">
          <a href=${ resolve('/') }>
            ${ chevron('left') }${ __('Show All Cooperatives') }
          </a>
          <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter">
            ${ loader() }
          </div>
        </div>
      </div>
    `;
  }

  const completedInitiatives = INITIATIVES.reduce((total, [prop]) => {
    return total + (cooperative[prop] ? 1 : 0);
  }, 0);
  const hasAllActions = actions.length === cooperative.actions.length;
  const missingActions = !hasAllActions && cooperative.actions.filter(id => {
    return !actions.find(action => action._id === id);
  });

  return html`
    <div class="App">
      ${ error(state, emit) }
      ${ header(state, emit) }

      <div class="App-container">
        <div class="App-part App-part--secondary App-part--last u-marginBm">
          <div class="Sheet Sheet--conditional Sheet--md Sheet--lg">
            <!-- Small viewport: page title -->
            <header class="u-md-hidden u-lg-hidden u-marginVm">
              <h1 class="Display Display--2 u-marginBb">${ cooperative.name }</h1>
              <a href=${ resolve('/') }>
                ${ chevron('left') }${ __('Show All Cooperatives') }
              </a>
            </header>

            <!-- Performance graph -->
            <div class="u-marginBm">
              ${ performance(cooperative, state.user) }
            </div>

            <!-- Small viewport: energy action summary -->
            <div class="u-md-hidden u-lg-hidden">
              <hr class="u-marginBm u-marginHl" />

              <div class="u-flex u-flexJustifyCenter u-marginVm u-textItalic">
                ${ cooperative.actions.length ? html`
                  <div>
                    <span class="u-floatLeft u-textG u-marginRb">${ cooperative.actions.length }</span>
                    <span class="u-textL">${ __n('Energy action', 'Energy actions', cooperative.actions.length) }</span>
                    <br />
                    <a href="#actions-${ id }">${ __('Show') }</a>
                  </div>
                ` : html`<span class="u-textL">${ __('No energy actions') }</span>` }
              </div>

              <hr class="u-marginBm u-marginHl" />
            </div>

            <!-- Cooperative details -->
            ${ definition({
              [__('Number of apartments')]: format(cooperative.numOfApartments),
              [__('Heated area')]: html`<span>${ format(cooperative.area) } m<sup>2</sup></span>`,
              [__('Year of construction')]: cooperative.yearOfConst,
              [__('Ventilation type')]: cooperative.ventilationType.map(type => __(`VENTILATION_TYPE_${ type }`)).join(', ')
            }) }

            <!-- Cooperative initatives -->
            <div class="u-flex u-flexJustifyCenter u-marginTl u-marginBs u-sizeFull">
              <div class="u-textNowrap">
                <span class="u-floatLeft u-textG u-marginRb">${ completedInitiatives }</span>
                <span class="u-textL u-colorPale">/${ INITIATIVES.length }</span>
                <br />
                <em>${ __n('Initiative', 'Initiatives', completedInitiatives) }</em>
              </div>
            </div>
            <ul>
              ${ INITIATIVES.map(([ prop, title, icon ]) => html`
                <li class="u-flex u-flexAlignItemsCenter u-marginTb u-textLight u-color${ cooperative[prop] ? 'Current' : 'Dim' }">
                  <span class="u-block u-marginRb">${ icon }</span> ${ title }
                </li>
              `) }
            </ul>

            ${ state.user.cooperative === cooperative._id ? html`
            <a class="Button u-block u-marginTm" href=${ resolve(`/cooperatives/${ cooperative._id }/edit`) }>
              ${ __('Edit details') }
            </a>
          ` : null }
          </div>
        </div>

        <!-- The chart -->
        <div class="App-part App-part--primary u-marginBm">
          ${ chart(html`
            <div class="u-marginBm">
              <h1 class="Display Display--1 u-marginBs">
                ${ cooperative.name }
              </h1>
              <a href=${ resolve('/') } class="u-colorCurrent">
                ${ chevron('left') }${ __('Show All Cooperatives') }
              </a>
            </div>`, Date.now(), cooperative, actions, state, emit) }
        </div>

        <!-- List of all energy actions -->
        <div class="App-part App-part--secondary u-marginBm" id="actions-${ id }">
          <h2 class="Display Display--4 u-marginBs u-textItalic">
            ${ actions.length ? __n('Energy action', 'Energy actions', cooperative.actions.length) : __('No energy actions') }
          </h2>

          ${ hasAllActions ?
            numbered(actions.map(action => summary(action, state))) :
            html`
              <div onload=${ () => emit('actions:fetch', missingActions) }>
                ${ loader() }
              </div>
            `
          }

          ${ state.user.cooperative === cooperative._id ? html`
            <a class="Button u-block u-marginTm" href=${ resolve(`/cooperatives/${ cooperative._id }/add-action`) }>
              ${ __('Add energy action') }
            </a>
          ` : null }
        </div>
      </div>

      ${ footer(state, emit) }

      ${ state.user.hasBoarded ? null : modal(
        onboarding(state, modal.close),
        () => emit('user:boarded')
      ) }
    </div>
  `;
}

view.title = function (state) {
  const cooperative = state.cooperatives.find(item => {
    return item._id === state.params.cooperative;
  });

  if (cooperative) {
    return cooperative.name;
  }
};
