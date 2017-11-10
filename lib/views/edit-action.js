const html = require('choo/html')
const app = require('../components/app')
const form = require('../components/action/form')
const { __ } = require('../locale')

module.exports = app(view, title)

function view (state, emit) {
  const { actions, params } = state
  const action = actions.find(props => props._id === params.action)

  return html`
    <div class="App-container App-container--sm u-block">
      <h1 class="Display Display--2 u-marginTl u-marginBm">${__('Edit energy action')}</h1>
      ${form(action, emit)}
    </div>
  `
}

function title () {
  return __('Edit energy action')
}
