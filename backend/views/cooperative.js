const html = require('choo/html');
const header = require('../components/page-head');
const performance = require('../components/performance');
const { defintion, numbered } = require('../components/list');
const { format } = require('../components/utils');
const { summary } = require('../components/action');
const footer = require('../components/app/footer');
const { __, __n } = require('../locale');

module.exports = function (state, prev, send) {
  const { cooperative: id } = state.location.params;
  const cooperative = state.cooperatives.find(props => props._id.toString() === id);

  return html`
    <div class="App">
      ${ header(state, prev, send) }

      <div class="App-container">
        <h1 class="Display Display--1">${ cooperative.name }</h1>

        ${ performance({ performance: cooperative.performance }) }

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

        ${ defintion({
          [__('Apartments')]: format(cooperative.numOfApartments),
          [__('Heated area')]: html`<span>${ format(cooperative.area) } m<sup>2</sup></span>`,
          [__('Constructed')]: cooperative.yearOfConst,
          [__('Ventilation type')]: cooperative.ventilationType.join(', ')
        }) }

        <div class="u-marginVm" id="actions-${ id }">
          ${ cooperative.actions && numbered(cooperative.actions.map(action => {
            const props = Object.assign({ cooperativeId: id }, action);
            return summary(props, state);
          })) }
        </div>
      </div>

      ${ footer(state, prev, send) }
    </div>
  `;
};
