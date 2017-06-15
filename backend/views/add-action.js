const html = require('choo/html');
const resolve = require('../resolve');
const header = require('../components/page-head')('add-action');
const form = require('../components/action/form');
const { chevron, loader } = require('../components/icons');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  const { cooperatives, params: { cooperative: id } } = state;
  const cooperative = cooperatives.find(item => item._id === id);

  if (!cooperative) {
    emit('cooperative:fetch', id);
    return html`
      <div class="App">
        ${ header(state, emit) }
        <div class="App-container u-flex u-flexCol">
          <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter">
            ${ loader() }
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--sm u-block">
        <a class="u-inlineBlock u-marginVs" href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>

        ${ form({ cooperative: cooperative._id }) }
      </div>
    </div>
  `;
}

view.title = () => __('Add energy action');
