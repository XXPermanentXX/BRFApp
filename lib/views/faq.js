const html = require('choo/html');
const friendlyUrl = require('friendly-url');
const app = require('../components/app');
const { loader } = require('../components/icons');
const component = require('../components/utils/component');
const { __ } = require('../locale');
const resolve = require('../resolve');

module.exports = app(view, title);

const content = component({
  name: 'faq',

  load(element) {
    const hash = location.hash.split('#')[1];

    if (hash) {
      const anchor = element.querySelector(`#${ hash }`);
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },

  render(doc) {
    return html`
      <div class="u-marginVl">
        <h1 class="Display Display--2">
          ${ doc.getStructuredText('faq.title').asText() }
        </h1>
        ${ doc.getGroup('faq.questions').toArray().map(question => html`
          <div id="${ friendlyUrl(question.getStructuredText('question').asText()) }">
            <hr class="u-marginVl" />
            <h3 class="Display Display--4">${ question.getStructuredText('question').asText() }</h3>
            <div class="Type">
              ${ question.getStructuredText('answer').asElement(resolve) }
            </div>
          </div>
        `) }
      </div>
    `;
  }
});

function view(state, emit) {
  let doc = state.content.faq;

  if (!doc) {
    emit('content:fetch', 'faq');
  }

  return html`
    <div class="App-container App-container--md u-flexExpand">
      ${ doc ? content(doc) : html`
        <div class="u-marginVl u-textCenter">
          ${ loader() }
        </div>
      ` }
    </div>
  `;
}

function title() {
  return __('How it works');
}
