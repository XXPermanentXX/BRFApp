const html = require('choo/html');
const resolve = require('../../resolve');

module.exports = function footer(state, emit) {
  return html`
    <footer class="App-footer">
      <div class="App-container App-container--md">
        <div class="Type u-textCenter">
          ${ state.footer.getStructuredText('footer.body').asElement(resolve) }
        </div>
      </div>
    </footer>
  `;
};
