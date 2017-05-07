const html = require('choo/html');
const { __ } = require('../../locale');

module.exports = function error(state, emit) {
  return html`
    <div role=${ state.error ? 'alert' : 'none' } class="App-error">
      ${ state.error ? html`
        <div class="App-container App-container--lg u-flexJustifyBetween u-paddingVs">
          ${ state.error }
          <button class="Button Button--link u-paddingLs u-colorCurrent" onclick=${ onclick }>
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
