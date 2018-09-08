const html = require('choo/html')
const moment = require('moment')
const capitalize = require('lodash.capitalize')
const resolve = require('../resolve')
const { __, __n } = require('../locale')
const app = require('../components/app')
const comment = require('../components/comment')
const { format } = require('../components/utils')
const { textarea } = require('../components/form')
const Chart = require('../components/chart')
const { Definition } = require('../components/list')
const { chevron, loader } = require('../components/icons')

module.exports = app(view, title)

function view (state, emit) {
  const { cooperatives, actions, params, user } = state
  const action = actions.find(props => props._id === params.action)

  if (!action) {
    emit('actions:fetch', params.action)
    return loading(state, emit)
  }

  const cooperative = cooperatives.find(props => props._id === action.cooperative)
  if (!cooperative) {
    emit('cooperatives:fetch', action.cooperative)
    return loading(state, emit)
  }

  return html`
    <div class="App-container">
      <div class="App-part App-part--primary u-marginBm">
        <!-- Small viewport: page title -->
        <header class="u-marginVm u-paddingHb u-md-hidden u-lg-hidden">
          <h1 class="Display Display--5">${__(`ACTION_TYPE_${action.type}`)}</h1>
          <a href="${resolve(`/cooperatives/${cooperative._id}`)}">
            ${chevron('left')}${__('Back to %s', cooperative.name)}
          </a>
        </header>

        <!-- The chart -->
        ${state.cache(Chart, `action-${action._id}`).render(header, action.date ? Date.parse(action.date) : moment().startOf('day'), cooperative, [Object.assign({merge: true}, action)])}
      </div>

      <div class="App-part App-part--secondary App-part--last u-marginBm">
        <!-- Action details -->
        <div class="Sheet Sheet--conditional Sheet--md Sheet--lg">
          ${state.cache(Definition, `${action._id}-details`).render(properties(action))}

          ${cooperative.editors.includes(user._id) ? [
            html`
              <a href="${resolve(`/actions/${action._id}/edit`)}" class="Button u-block u-marginTs u-marginBb">
                ${__('Edit energy action')}
              </a>
            `,
            html`
              <form action="/actions/${action._id}" method="POST" enctype="application/x-www-form-urlencoded">
                <input type="hidden" name="_method" value="DELETE" />
                <button type="submit" class="Button Button--warning u-sizeFull">
                  ${__('Remove enery action')}
                </button>
              </form>
            `
          ] : null}
        </div>
      </div>

      <!-- Comments -->
      <div class="App-part App-part--secondary u-marginBm" id="comments-${action._id}">
        <h2 class="Display Display--4 u-marginBm u-textItalic">
          ${action.comments.length ? __n('Comment', 'Comments', action.comments.length) : __('No comments yet')}
        </h2>

        <ol class="List u-marginVm">
          ${action.comments.map(props => html`<li>${comment(props, action, state)}</li>`)}
        </ol>

        <!-- Comment form -->
        ${user.isAuthenticated ? html`
          <form action="${action._id}/comments" method="POST" class="Form">
            <div class="u-marginBb">
              ${textarea({ label: __('Leave a comment'), rows: 3, name: 'comment' })}
            </div>
            <button type="submit" class="Button u-block u-sizeFull">${__('Post')}</button>
          </form>
        ` : null}
      </div>
    </div>
  `

  function header () {
    return html`
      <div class="u-marginBb">
        <h1 class="Display Display--4 u-marginBb">
          ${__(`ACTION_TYPE_${action.type}`)}
        </h1>
        <a class="u-colorCurrent" href="${resolve(`/cooperatives/${cooperative._id}`)}">
          ${chevron('left')}${__('Back to %s', cooperative.name)}
        </a>
      </div>
    `
  }
}

function title (state) {
  const action = state.actions.find(item => item._id === state.params.action)

  if (action) {
    return __(`ACTION_TYPE_${action.type}`)
  }
}

function loading (state, emit) {
  return html`
    <div class="App-container u-flex u-flexCol">
      <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter">
        ${loader()}
      </div>
    </div>
  `
}

function properties (action) {
  const props = {}

  if (action.date) {
    props[__('Date')] = capitalize(moment(action.date).format('MMMM YYYY'))
  }

  if (action.type) {
    props[__('Action')] = __(`ACTION_TYPE_${action.type}`)
  }

  if (action.cost) {
    props[__('Cost')] = `${format(action.cost)} kr`
  }

  if (action.contractor) {
    props[__('Contractor')] = action.contractor
  }

  if (action.description) {
    props[__('Description')] = action.description
  }

  return props
}
