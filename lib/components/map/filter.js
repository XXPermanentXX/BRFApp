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
    this.view = 'filter'
    this.criteria = 'includes'
  }

  update () {
    return false
  }

  createElement (callback) {
    const self = this
    const props = this.props

    return html`
      <form class="Form" onsubmit=${onsubmit}>
        <button role="tab" aria-controls="${this.id}-filter" aria-expanded="${this.view === 'filter'}" onclick=${show('filter')} class="${this.view === 'filter' ? 'Display Display--6' : 'Link'} u-inlineBlock u-marginVs u-marginHs">${__('Filter')}</button>
        <button role="tab" aria-controls="${this.id}-search" aria-expanded="${this.view === 'search'}" onclick=${show('search')} class="${this.view === 'search' ? 'Display Display--6' : 'Link'} u-inlineBlock u-marginVs u-marginHs">${__('Search')}</button>
        <div role="tabpanel" id="${this.id}-search">
          ${this.view === 'search' ? html`
            <fieldset>
              <legend class="Form-label u-colorDark u-marginAs">${__('Find a cooperative by searhing for it by its name.')}</legend>
              ${input({ label: __('Type here'), id: 'coop-search-input', type: 'search', name: 'name', oninput: setProp, value: props.name, autocomplete: 'off', autofocus: true, autocorrect: 'off' })}
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
          self.rerender()
          self.element.querySelector('input,select,textarea').focus()
        }
        event.preventDefault()
      }
    }

    function onsubmit (event) {
      callback(Object.keys(props).reduce((result, key) => {
        if (key === 'name') result[key] = props[key]
        else if (props[key]) result[key] = self.criteria === 'includes'
        return result
      }, {}))
      event.preventDefault()
    }

    function setProp (event) {
      if (event.target.name === 'criteria') {
        self.criteria = event.target.value
        delete props.hasBelysningsutmaningen
        delete props.hasConsumptionMapping
        delete props.hasEnergyProduction
        delete props.hasRepresentative
        delete props.hasGoalManagement
        delete props.hasCharger
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
