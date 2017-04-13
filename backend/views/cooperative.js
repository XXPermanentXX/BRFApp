const html = require('choo/html');
const header = require('../components/page-head');
const performance = require('../components/performance');
const createChart = require('../components/chart');
const { definition, numbered } = require('../components/list');
const { format, getPerformance } = require('../components/utils');
const { summary } = require('../components/action');
const { chevron, loader } = require('../components/icons');
const error = require('../components/app/error');
const footer = require('../components/app/footer');
const { __, __n } = require('../locale');

const chart = createChart();

module.exports = function (state, emit) {
  const { cooperative: id } = state.params;
  const cooperative = state.cooperatives.find(props => props._id === id);
  const actions = state.actions.filter(props => props.cooperative === id);

  if (!cooperative) {
    return html`
      <div class="App" onload=${ () => emit('cooperatives:fetch', id) }>
        ${ error(state, emit) }
        ${ header(state, emit) }
        <div class="App-container">
          <a href="/cooperatives">
            ${ chevron('left') }${ __('Show All Cooperatives') }
          </a>
          ${ performance() }
          ${ loader() }
        </div>
      </div>
    `;
  }

  const hasAllActions = actions.length === cooperative.actions.length;
  const missingActions = !hasAllActions && cooperative.actions.filter(id => {
    return !actions.find(action => action._id === id);
  });

  return html`
    <div class="App">
      ${ error(state, emit) }
      ${ header(state, emit) }

      <div class="App-container">
        <h1 class="Display Display--1 u-marginBb">${ cooperative.name }</h1>
        <div class="u-marginBm">
          <a href="/cooperatives">
            ${ chevron('left') }${ __('Show All Cooperatives') }
          </a>
        </div>

        ${ performance(getPerformance(cooperative)) }

        <hr class="u-marginVm" />

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

        <hr class="u-marginVm" />

        ${ definition({
          [__('Apartments')]: format(cooperative.numOfApartments),
          [__('Heated area')]: html`<span>${ format(cooperative.area) } m<sup>2</sup></span>`,
          [__('Constructed')]: cooperative.yearOfConst,
          [__('Ventilation type')]: cooperative.ventilationType.join(', ')
        }) }

      </div>

      <div class="u-marginVm">
        ${ chart(Date.now(), cooperative, actions, state, emit) }
      </div>

      <div class="App-container u-marginBm">
        <div id="actions-${ id }">
          ${ hasAllActions ?
            numbered(actions.map(action => summary(action, state))) :
            html`
              <div onload=${ () => emit('actions:fetch', missingActions) }>
                ${ loader() }
              </div>
            `
          }
        </div>
      </div>

      ${ footer(state, emit) }
    </div>
  `;
};
