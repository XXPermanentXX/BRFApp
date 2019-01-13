const html = require('choo/html')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const view = require('../components/view')
const { loader } = require('../components/icons')
const signup = require('../components/auth/signup')
const { __ } = require('../lib/locale')

module.exports = view(signUp, title)

function signUp (state, emit) {
  const doc = state.content.registration

  if (!doc) {
    emit('content:fetch', 'registration')
  }

  const content = doc ? html`
    <div class="u-marginVl">
      <h1 class="Display Display--2 u-textCenter">${asText(doc.data.disclaimer_title)}</h1>
      <div class="Type">${asElement(doc.data.disclaimer_body)}</div>
    </div>
  ` : html`
    <div class="u-marginVl u-textCenter">
      ${loader()}
    </div>
  `

  return html`
    <div class="View-container View-container--md u-block">
      ${signup(content)}
    </div>
  `
}

function title () {
  return __('Create an account')
}
