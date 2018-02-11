const html = require('choo/html')
const component = require('fun-component')
const app = require('../components/app')
const performance = require('../components/performance')
const createChart = require('../components/chart')
const { definition, numbered } = require('../components/list')
const { summary } = require('../components/action')
const { chevron, loader } = require('../components/icons')
const icons = require('../components/icons')
const { format } = require('../components/utils')
const { __, __n } = require('../locale')
const resolve = require('../resolve')

const INITIATIVES = [
  [ 'hasRepresentative', 'Designated Energyrepresentative', icons.energyRepresentative(26) ],
  [ 'hasConsumptionMapping', 'Energy consumption mapping', icons.energyMap(26) ],
  [ 'hasGoalManagement', 'Goal oriented energy management', icons.target(26) ],
  [ 'hasBelysningsutmaningen', 'Part of belysningsutmaningen', icons.lightChallenge(26) ],
  [ 'hasCharger', 'Electric car charger', icons.electricCar(26) ],
  [
    ['hasEnergyProduction', 'hasSolarPanels', 'hasGeothermalHeating'],
    function (cooperative) {
      const types = {
        hasSolarPanels: 'Solar panels',
        hasGeothermalHeating: 'Geothermal heating'
      }
      const extra = Object.keys(types).filter(type => cooperative[type])
      let text = __('Renewable energy production')

      if (extra.length) {
        text += `: ${extra.map(type => __(types[type])).join(__(' and '))}`
      }

      return text
    },
    icons.solarPanel(26)
  ]
]

const chart = createChart('cooperative-chart')

module.exports = app(view, title)

const loading = component({
  name: 'cooperative-loading',

  load (element, state, emit) {
    emit('cooperatives:fetch', state.params.cooperative)
  },

  render (state, emit) {
    return html`
      <div class="App-container">
        <div class="u-flex u-flexCol u-flexJustifyCenter">
          ${loader()}
          <a href="${resolve('/')}">
            ${__('Show All Cooperatives')}
          </a>
        </div>
      </div>
    `
  }
})

function view (state, emit) {
  const { consumptions, params: { cooperative: id } } = state
  const cooperative = state.cooperatives.find(props => props._id === id)
  const actions = state.actions
    .filter(props => props.cooperative === id)
    .sort((a, b) => a.date > b.date ? 1 : -1)

  if (!cooperative) {
    return loading(state, emit)
  }

  const hasAllActions = actions.length === cooperative.actions.length
  const missingActions = !hasAllActions && cooperative.actions.filter(id => {
    return !actions.find(action => action._id === id)
  })

  if (!hasAllActions) {
    emit('actions:fetch', missingActions)
  }

  /**
   * Don't try and render a cooperative with a type it has no meters for
   */

  const meter = cooperative.meters.find(meter => meter.type === consumptions.type)
  if (!meter && cooperative.meters.length) {
    emit('consumptions:type', cooperative.meters[0].type)
  }

  const details = {}

  if (cooperative.numOfApartments) {
    details[__('Number of apartments')] = format(cooperative.numOfApartments)
  }

  if (cooperative.area) {
    details[__('Heated area')] = html`<span>${format(cooperative.area)} m<sup>2</sup></span>`
  }

  if (cooperative.yearOfConst) {
    details[__('Year of construction')] = cooperative.yearOfConst
  }

  if (cooperative.ventilationType && cooperative.ventilationType.length) {
    details[__('Ventilation type')] = cooperative.ventilationType.map(type => __(`VENTILATION_TYPE_${type}`)).join(', ')
  }

  if (!cooperative.needUpdate) {
    details[cooperative.hasLaundryRoom ? __('Has shared laundry room') : __('Does not have shared laundry room')] = null
    details[cooperative.hasGarage ? __('Has garage') : __('Does not have garage')] = null
  }

  if (cooperative.email) {
    details[__('Contact regarding energy')] = html`<a href="mailto:${cooperative.email}">${cooperative.email}</a>`
  }

  return html`
    <div class="App-container">
      <div class="App-part App-part--secondary App-part--last u-marginBm">
        <div class="Sheet Sheet--conditional Sheet--md Sheet--lg">
          <!-- Small viewport: page title -->
          <header class="u-md-hidden u-lg-hidden u-marginVm">
            <h1 class="Display Display--2 u-marginBb">${cooperative.name}</h1>
            <a href="${resolve('/')}">
              ${chevron('left')} ${__('Show All Cooperatives')}
            </a>
          </header>

          <!-- Performance graph -->
          <div class="u-marginBm">
            ${performance(cooperative, state.user)}
          </div>

          <!-- Small viewport: energy action summary -->
          <div class="u-md-hidden u-lg-hidden">
            <hr class="u-marginBm u-marginHl" />

            <div class="u-flex u-flexJustifyCenter u-marginVm u-textItalic">
              ${cooperative.actions.length ? html`
                <div>
                  <span class="u-floatLeft u-textG u-marginRb">${cooperative.actions.length}</span>
                  <span class="u-textL">${__n('Energy action', 'Energy actions', cooperative.actions.length)}</span>
                  <br />
                  <a href="#actions-${id}">${__('Show')}</a>
                </div>
              ` : html`<span class="u-textL">${__('No energy actions')}</span>`}
            </div>

            <hr class="u-marginBm u-marginHl" />
          </div>

          <!-- Cooperative details -->
          ${definition(details)}

          <!-- Cooperative initatives -->
          ${INITIATIVES.find(hasInitiative(cooperative)) ? html`
            <div class="u-marginTm">
              <h2 class="Display Display--4 u-marginBs u-textItalic">
                ${__('Energy initiatives')}
              </h2>
              <ul>
                ${INITIATIVES.filter(hasInitiative(cooperative)).map(([ , title, icon ]) => html`
                  <li class="u-flex u-flexAlignItemsCenter u-marginTb u-textLight u-colorCurrent">
                    <span class="u-block u-marginRb">${icon}</span> ${typeof title === 'function' ? title(cooperative) : __(title)}
                  </li>
                `)}
              </ul>
            </div>
          ` : null}

          ${state.user.cooperative === cooperative._id ? html`
          <a class="Button u-block u-marginTm" href="${resolve(`/cooperatives/${cooperative._id}/edit`)}">
            ${__('Edit details')}
          </a>
        ` : null}
        </div>
      </div>

      <!-- The chart -->
      <div class="App-part App-part--primary u-marginBm">
        ${chart(html`
          <div class="u-marginBm">
            <h1 class="Display Display--1 u-marginBs">
              ${cooperative.name}
            </h1>
            <a href="${resolve('/')}" class="u-colorCurrent">
              ${chevron('left')}${__('Show All Cooperatives')}
            </a>
          </div>`, Date.now(), cooperative, actions, state, emit)}
      </div>

      <!-- List of all energy actions -->
      <div class="App-part App-part--secondary u-marginBm" id="actions-${id}">
        <h2 class="Display Display--4 u-marginBs u-textItalic">
          ${actions.length ? __n('Energy action', 'Energy actions', cooperative.actions.length) : __('No energy actions')}
        </h2>

        ${hasAllActions ? numbered(actions.map(action => summary(action, state))) : html`
          <div class="u-colorSky">
            ${loader()}
          </div>
        `}

        ${state.user.cooperative === cooperative._id ? html`
          <a class="Button u-block u-marginTm" href="${resolve(`/cooperatives/${cooperative._id}/add-action`)}">
            ${__('Add energy action')}
          </a>
        ` : null}
      </div>
    </div>
  `
}

function title (state) {
  const cooperative = state.cooperatives.find(item => {
    return item._id === state.params.cooperative
  })

  if (cooperative) {
    return cooperative.name
  }
}

function hasInitiative (cooperative) {
  return function ([ prop ]) {
    if (Array.isArray(prop)) return !!prop.find(key => cooperative[key])
    return !!cooperative[prop]
  }
}
