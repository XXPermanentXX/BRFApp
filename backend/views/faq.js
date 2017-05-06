const html = require('choo/html');
const header = require('../components/page-head');
const { loader } = require('../components/icons');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  let doc = state.faq;

  if (!doc) {
    return html`
      ${ loader() }
    `;
  }

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container">
        <div class="App-part">
          <h1 class="Display Display--2">
            ${ doc.getStructuredText('faq.title').asText() }
          </h1>
          ${ doc.getGroup('faq.questions').toArray().map(question => html`
            <div>
              <h3 class="Display Display--4">${ question.getStructuredText('question').asText() }</h3>
              ${ question.getStructuredText('answer').asHtml() }
            </div>
          `) }
        </div>
      </div>
    </div>
  `;
}

view.title = () => __('How it works');
