const html = require('choo/html');
const header = require('../components/page-head')('error');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  return html`
    <div class="App">
      ${ header(state, emit) }
      <h1>Oops!</h1>
    </div>
  `;
}

view.title = () => __('An error has occured');
