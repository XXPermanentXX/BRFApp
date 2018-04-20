const html = require('choo/html')
const Component = require('choo/component')
const { __ } = require('../../locale')
const { input, checkbox, radiogroup } = require('../form')

module.exports = class Filter extends Component {
  constructor (id, state, emit) {
    super(id)
    this.id = id
    this.state = state
    this.emit = emit
    this.props = {}
    this.search = ''
    this.view = 'filter'
    this.criteria = 'includes'
  }

  static apply (cooperatives, filter = {}) {
    const filters = Object.keys(filter)
    if (!filters.length) return cooperatives

    return cooperatives.filter((cooperative) => {
      for (let i = 0, len = filters.length, key, value; i < len; i++) {
        key = filters[i]
        value = filter[key]

        if (typeof value === 'string') {
          value = value.toLowerCase()
          // Match text content
          if (cooperative[key].toLowerCase().indexOf(value) === -1) {
            return false
          }
        } else {
          if (key === 'hasEnergyProduction') {
            // Proxy all types of energy production
            if (cooperative.hasSolarPanels !== value) return false
            if (cooperative.hasGeothermalHeating !== value) return false
          }
          // Compare boolean values
          if (cooperative[key] !== value) return false
        }
      }

      return true
    })
  }

  update () {
    return false
  }

  createElement (cooperatives, onfilter, onselect) {
    const self = this
    const props = this.props

    const pattern = new RegExp(this.search.replace(/\\/, '//'), 'i')
    const results = this.search ? cooperatives.filter(item => {
      return pattern.test(item.name)
    }) : []

    return html`
      <form class="Form" onsubmit=${onsubmit}>
        <button role="tab" aria-controls="${this.id}-filter" aria-expanded="${this.view === 'filter'}" onclick=${show('filter')} class="${this.view === 'filter' ? 'Display Display--6' : 'Link'} u-inlineBlock u-marginVs u-marginHs">${__('Filter')}</button>
        <button role="tab" aria-controls="${this.id}-search" aria-expanded="${this.view === 'search'}" onclick=${show('search')} class="${this.view === 'search' ? 'Display Display--6' : 'Link'} u-inlineBlock u-marginVs u-marginHs">${__('Search')}</button>
        <div role="tabpanel" id="${this.id}-search">
          ${this.view === 'search' ? html`
            <fieldset>
              <legend class="Form-label u-colorDark u-marginAs">${__('Find a cooperative by searhing for it by its name.')}</legend>
              ${input({ label: __('Type here'), id: 'coop-search-input', type: 'search', name: 'name', oninput: filter, value: this.search, autocomplete: 'off', autofocus: true, autocorrect: 'off' })}
              ${this.search ? html`
                <ul class="List">
                  ${results.length ? results.slice(0, 6).map(item => html`
                    <li class="List-item">
                      <button class="Button Button--link u-block u-sizeFull u-paddingAb" value="${item._id}" onclick=${() => onselect(item._id)}>
                        ${item.name}
                      </button>
                    </li>
                  `) : html`
                    <li class="ListItem u-paddingHb u-paddingVm u-textCenter">
                      <em class="u-colorDark">${__('Sorry, we couldn\'t find any cooperative by that name')}</em>
                    </li>
                  `}
                </ul>
              ` : null}
            </fieldset>
          ` : null}
        </div>
        <div role="tabpanel" id="${this.id}-filter">
          ${this.view === 'filter' ? html`
            <fieldset class="u-nbfc">
              <legend class="Form-label u-colorDark u-marginAs">${__('Select which cooperatives are shown on the map by picking energy initiatives below.')}</legend>
              ${radiogroup([{
                label: __('Show cooperatives that have'),
                value: 'includes',
                checked: this.criteria === 'includes',
                name: 'criteria',
                onchange: setProp
              }, {
                label: __('Show cooperatives that do not have'),
                value: 'excludes',
                checked: this.criteria === 'excludes',
                name: 'criteria',
                onchange: setProp
              }])}
              ${[
                checkbox({ label: __('Assigned energy representative'), onchange: setProp, name: 'hasRepresentative', checked: props.hasRepresentative }),
                checkbox({ label: __('Energy consumption mapping'), onchange: setProp, name: 'hasConsumptionMapping', checked: props.hasConsumptionMapping }),
                checkbox({ label: __('Goal oriented energy management'), onchange: setProp, name: 'hasGoalManagement', checked: props.hasGoalManagement }),
                checkbox({ label: __('Participating in belysningsutmaningen'), onchange: setProp, name: 'hasBelysningsutmaningen', checked: props.hasBelysningsutmaningen }),
                checkbox({ label: __('Charger for electric cars'), onchange: setProp, name: 'hasCharger', checked: props.hasCharger }),
                checkbox({ label: __('Renewable energy production '), onchange: setProp, name: 'hasEnergyProduction', checked: props.hasEnergyProduction })
              ]}
              <button type="submit" class="Button u-block u-sizeFull">
                ${__('Filter')}
              </button>
            </fieldset>
          ` : null}
        </div>
      </form>
    `

    function show (id) {
      return function (event) {
        if (self.view !== id) {
          self.view = id
          self.search = ''
          self.props = {}
          self.rerender()
          self.element.querySelector('input,select,textarea').focus()
        }
        event.preventDefault()
      }
    }

    function filter (event) {
      self.search = event.target.value
      self.rerender()
    }

    function onsubmit (event) {
      onfilter(Object.keys(props).reduce((result, key) => {
        if (key === 'name') result[key] = props[key]
        else if (props[key]) result[key] = self.criteria === 'includes'
        return result
      }, {}))
      event.preventDefault()
    }

    function setProp (event) {
      if (event.target.name === 'criteria') {
        self.criteria = event.target.value
        self.props = {}
        self.rerender()
      } else {
        if (event.target.value) {
          if (event.target.type === 'checkbox') {
            props[event.target.name] = event.target.checked
          } else {
            props[event.target.name] = event.target.value
          }
        } else {
          delete [event.target.name]
        }
      }
    }
  }
}
