const html = require('choo/html')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const view = require('../components/view')
const { loader } = require('../components/icons')
const signin = require('../components/auth/signin')
const resolve = require('../lib/resolve')
const { __ } = require('../lib/locale')

module.exports = view(signIn, title)

function signIn (state, emit) {
  const doc = state.content['sign-in']

  if (!doc) {
    emit('content:fetch', 'sign-in')
  }

  const content = doc ? html`
    <div class="u-marginVl">
      <h1 class="Display Display--2 u-textCenter">${asText(doc.data.title)}</h1>
      <div class="Type">${asElement(doc.data.body)}</div>
    </div>
  ` : html`
    <div class="u-marginVl u-textCenter">
      ${loader()}
    </div>
  `

  return html`
    <div class="View-container View-container--md u-block">
      ${signin(content, onsignup)}
    </div>
  `

  function onsignup (event) {
    emit('pushState', resolve('/auth/sign-up'))
  }
}

function title () {
  return __('Sign in')
}
