const html = require('choo/html');
const resolve = require('../resolve');
const header = require('../components/page-head')('edit-action');
const form = require('../components/action/form');
const { chevron } = require('../components/icons');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  const { actions, params } = state;
  const action = actions.find(props => props._id === params.action);

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--sm u-block">

        <a class="u-inlineBlock u-marginVs" href=${ resolve(`/actions/${ action._id }`) }>
          ${ chevron('left') }${ __('Back to %s', action.name) }
        </a>

        ${ form(action) }
      </div>
    </div>
  `;
}

view.title = function (state) {
  const action = state.actions.find(item => item._id === state.params.action);

  if (action) {
    return action.name;
  }
};
