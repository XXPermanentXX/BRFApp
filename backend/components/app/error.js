const html = require('choo/html');
const { __ } = require('../../locale');

module.exports = function error(state, emit) {
  return html`
    <div role=${ state.error ? 'alert' : 'none' } class="App-error">
      ${ state.error ? html`
        <div class="App-container u-paddingAb u-nbfc">
          ${ state.error }
          <button class="Button Button--link u-floatRight u-colorCurrent" onclick=${ onclick }>
            ${ __('Close') }
          </button>
        </div>
      ` : null }
    </div>
  `;

  function onclick() {
    emit('error:dismiss');
  }
};
