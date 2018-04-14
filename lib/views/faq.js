const html = require('choo/html')
const friendlyUrl = require('friendly-url')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const { __ } = require('../locale')
const resolve = require('../resolve')
const app = require('../components/app')
const { loader } = require('../components/icons')

module.exports = app(view, title)

function view (state, emit) {
  let doc = state.content.faq

  if (!doc) {
    emit('content:fetch', 'faq')
    return html`
      <div class="App-container App-container--md u-flexExpand">
        <div class="u-marginVl u-textCenter">
          ${loader()}
        </div>
      </div>
    `
  } else if (state.params.anchor) {
    emit('scrollto', state.params.anchor)
  }

  return html`
    <div class="App-container App-container--md u-flexExpand">
      <div class="u-marginVl">
        <h1 class="Display Display--2">
          ${asText(doc.data.title)}
        </h1>
        ${doc.data.questions.map(question => html`
          <div id="${friendlyUrl(asText(question.question))}">
            <hr class="u-marginVl" />
            <h3 class="Display Display--4">${asText(question.question)}</h3>
            <div class="Type">
              ${asElement(question.answer, resolve)}
            </div>
          </div>
        `)}
      </div>
    </div>
  `
}

function title () {
  return __('How it works')
}
