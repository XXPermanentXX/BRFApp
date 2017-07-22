const html = require('choo/html');
const resolve = require('../resolve');
const header = require('../components/page-head')('edit-action');
const error = require('../components/app/error');
const form = require('../components/action/form');
const { chevron } = require('../components/icons');
const { __, __n } = require('../locale');

module.exports = view;

function view(state, emit) {
  const { actions, params } = state;
  const action = actions.find(props => props._id === params.action);

  return html`
    <div class="App">
      ${ error(state, emit) }
      ${ header(state, emit) }
      <div class="App-container App-container--sm u-block">
        <h1 class="Display Display--2 u-marginTl u-marginBm">${ __('Edit energy action') }</h1>

        ${ form(action, emit) }
      </div>
    </div>
  `;
}

view.title = () => __('Edit energy action');
