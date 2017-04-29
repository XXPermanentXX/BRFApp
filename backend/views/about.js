const html = require('choo/html');
const header = require('../components/page-head');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  return html`
    <div class="App">
      ${ header(state, emit) }
    </div>
  `;
}

view.title = () => __('About the project');
