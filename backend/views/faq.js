const html = require('choo/html');
const friendlyUrl = require('friendly-url');
const header = require('../components/page-head');
const footer = require('../components/app/footer');
const { loader } = require('../components/icons');
const { __ } = require('../locale');
const resolve = require('../resolve');

module.exports = view;

function view(state, emit) {
  let doc = state.faq;

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--md u-flexExpand">
        ${ doc ?
          html`
            <div class="u-marginVl">
              <h1 class="Display Display--2">
                ${ doc.getStructuredText('faq.title').asText() }
              </h1>
              ${ doc.getGroup('faq.questions').toArray().map(question => html`
                <div id=${ friendlyUrl(question.getStructuredText('question').asText()) }>
                  <hr class="u-marginVl" />
                  <h3 class="Display Display--4">${ question.getStructuredText('question').asText() }</h3>
                  <div class="Type">
                    ${ question.getStructuredText('answer').asElement(resolve) }
                  </div>
                </div>
              `) }
            </div>` :
          html`
            <div class="u-marginVl u-textCenter" onload=${ () => emit('cms:faq') }>
              ${ loader() }
            </div>
        ` }
      </div>

      ${ footer(state, emit) }
    </div>
  `;
}

view.title = () => __('How it works');
