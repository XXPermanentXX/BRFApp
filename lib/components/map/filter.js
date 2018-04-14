const html = require('choo/html')
const Component = require('choo/component')
const { __ } = require('../../locale')
const { input, checkbox, radiogroup } = require('../form')

module.exports = class Filter extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
    this.props = {}
    this.criteria = 'includes'
  }

  update () {
    return false
  }

  createElement (callback) {
    const props = this.props
    const onsubmit = (event) => {
      callback(Object.keys(props).reduce((result, key) => {
        if (key === 'name') result[key] = props[key]
        else if (props[key]) result[key] = this.criteria === 'includes'
        return result
      }, {}))
      event.preventDefault()
    }
    const setProp = (event) => {
      if (event.target.name === 'criteria') {
        this.criteria = event.target.value
        delete props.hasBelysningsutmaningen
        delete props.hasConsumptionMapping
        delete props.hasEnergyProduction
        delete props.hasRepresentative
        delete props.hasGoalManagement
        delete props.hasCharger
        this.rerender()
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

    return html`
      <form class="Form" onsubmit=${onsubmit}>
        <h3 class="Display Display--6 u-marginVm u-marginHs">${__('Find cooperative')}</h2>
        ${input({ label: __('Type here'), id: 'coop-search-input', type: 'search', name: 'name', oninput: setProp, value: props.name, autocomplete: 'off', autofocus: true, autocorrect: 'off' })}
        <h3 class="Display Display--6 u-marginVm u-marginHs">${__('Filter')}</h2>
        <div class="u-marginTm u-nbfc">
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
        </div>
      </form>
    `
  }
}
