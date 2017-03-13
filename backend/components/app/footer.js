const html = require('choo/html');
const moment = require('moment');
const { __ } = require('../../locale');

module.exports = function footer(state, prev, send) {
  return html`
    <footer class="App-footer">
      <div class="App-container">
        <div class="Type">
          ${ html([ `<p>${ __('PROJECT_IN_SHORT', 'info@brfenergi.com') }</p>` ]) }
          ${ html([ `<p>${ __('LICENSE_NOTICE', 'https://github.com/CIVIS-project/BRFApp') }</p>` ]) }
          <p class="u-textCenter">${ __('COPYRIGHT', moment(Date.now()).format('YYYY')) }</p>
        </div>
      </div>
    </footer>
  `;
};
