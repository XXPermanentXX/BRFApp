const html = require('choo/html')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const app = require('../components/app')
const { loader } = require('../components/icons')
const { follow } = require('../components/utils')
const resolve = require('../resolve')
const { __ } = require('../locale')

module.exports = app(view, title)

function view (state, emit) {
  const doc = state.content.registration

  if (!doc) {
    emit('content:fetch', 'registration')
  }

  return html`
    <div class="App-container App-container--md u-block">
      ${doc ? html`
        <div class="u-marginVl">
          <h1 class="Display Display--2">
            ${asText(doc.data.disclaimer_title)}
          </h1>
          <div class="Type">
            ${asElement(doc.data.disclaimer_body)}
          </div>
        </div>
      ` : html`
        <div class="u-marginVl u-textCenter">
          ${loader()}
        </div>
      `}
        <a href="${resolve('/auth/metry/sign-up')}" onclick=${follow} class="Button u-block">
          ${__('Create an account')}
        </a>
    </div>
  `
}

function title () {
  return __('Create an account')
}
