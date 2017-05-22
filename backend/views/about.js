const html = require('choo/html');
const header = require('../components/page-head')('about');
const footer = require('../components/app/footer');
const { loader } = require('../components/icons');
const { __ } = require('../locale');
const resolve = require('../resolve');

module.exports = view;

function view(state, emit) {
  let doc = state.about;

  if (!doc) {
    emit('cms:about');
  }

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--md u-flexExpand">
        ${ doc ?
          html`
            <div class="u-marginVl">
              <h1 class="Display Display--2">
                ${ doc.getStructuredText('about.title').asText() }
              </h1>
              <div class="Type">
                ${ doc.getStructuredText('about.body').asElement(resolve) }
              </div>
            </div>` :
          html`
            <div class="u-marginVl u-textCenter">
              ${ loader() }
            </div>
        ` }
      </div>

      ${ footer(state, emit) }
    </div>
  `;
}

view.title = () => __('About the project');
