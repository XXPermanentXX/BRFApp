const html = require('choo/html');
const app = require('../components/app');
const { loader } = require('../components/icons');
const { __ } = require('../locale');
const resolve = require('../resolve');

module.exports = app(view, title);

function view(state, emit) {
  let doc = state.content.about;

  if (!doc) {
    emit('content:fetch', 'about');
  }

  return html`
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
  `;
}

function title() {
  return __('About Brf Energi');
}
