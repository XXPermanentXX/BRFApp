const html = require('choo/html');
const header = require('../components/page-head');
const { loader } = require('../components/icons');
const resolve = require('../resolve');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  const doc = state['sign-in'];

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--md u-block">
        ${ doc ? html`
          <div class="u-marginVl">
            <h1 class="Display Display--2">
              ${ doc.getStructuredText('sign-in.title').asText() }
            </h1>
            <div class="Type">
              ${ doc.getStructuredText('sign-in.body').asElement() }
            </div>
          </div>
        ` : html`
          <div class="u-marginVl u-textCenter" onload=${ () => emit('cms:sign-in') }>
            ${ loader() }
          </div>
        ` }
        <div class="u-flex">
          <a href=${ resolve('/auth/sign-up') } class="Button Button--secondary u-flexGrow1 u-flexShrink0">
            ${ __('I don\'t have an account') }
          </a>
          <a href=${ resolve('/auth/metry') } data-no-routing class="Button Button  u-flexGrow1 u-flexShrink0">
            ${ __('Sign in with Metry') }
          </a>
        </div>
      </div>
    </div>
  `;
}

view.title = () => __('Sign in');
