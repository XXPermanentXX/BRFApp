const html = require('choo/html');
const header = require('../components/page-head');
const performance = require('../components/performance');

module.exports = function (state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
      <div class="App-container">
        <h1 class="App-title">${ state.name }</h1>
        ${ performance({ performance: state.performance }) }
        <hr class="u-marginVm" />
        <div class="u-flex u-flexJustifyCenter u-marginVm u-styleItalic">
          ${ state.actions.length ? html`
            <div>
              <span class="u-floatLeft u-sizeG u-marginRb">${ state.actions.length }</span>
              <span class="u-sizeL">Energy actions</span>
              <br />
              <a href="#energy-actions">Show</a>
            </div>
          ` : html`<span class="u-sizeL">No energy actions</span>` }
        </div>
      </div>
    </div>
  `;
};
