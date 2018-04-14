const html = require('choo/html')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const app = require('../components/app')
const { loader } = require('../components/icons')
const { __ } = require('../locale')
const resolve = require('../resolve')

module.exports = app(view, title)

function view (state, emit) {
  let doc = state.content.about

  if (!doc) {
    emit('content:fetch', 'about')
  } else if (state.params.anchor) {
    emit('scrollto', state.params.anchor)
  }

  return html`
    <div class="App-container App-container--md u-flexExpand">
      ${doc
        ? html`
          <div class="u-marginVl">
            <h1 class="Display Display--2">
              ${asText(doc.data.title)}
            </h1>
            <div class="Type">
              ${asElement(doc.data.body, resolve)}
            </div>
          </div>`
        : html`
          <div class="u-marginVl u-textCenter">
            ${loader()}
          </div>
      `}
    </div>
  `
}

function title () {
  return __('About Brf Energi')
}
