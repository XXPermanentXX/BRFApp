const html = require('choo/html');
const component = require('fun-component');
const { __ } = require('../../locale');

const message = component({
  name: 'error',

  load(element) {
    element.scrollIntoView({ behavior: 'smooth' });
  },

  render(text, onclick) {
    return html`
      <div class="App-container App-container--lg u-flexJustifyBetween u-paddingVs">
        ${ text }
        <button class="Button Button--link u-paddingLs u-colorCurrent" onclick=${ onclick }>
          ${ __('Close') }
        </button>
      </div>
    `;
  }
});

module.exports = function error(state, emit) {
  return html`
    <div role="${ state.error ? 'alert' : 'none' }" class="App-error" id="app-error">
      ${ state.error ? message(__(state.error.message), onclick) : null }
    </div>
  `;

  function onclick() {
    emit('error:dismiss');
  }
};
