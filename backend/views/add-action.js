const html = require('choo/html');
const resolve = require('../resolve');
const header = require('../components/page-head')('add-action');
const error = require('../components/app/error');
const form = require('../components/action/form');
const { chevron, loader } = require('../components/icons');
const { __ } = require('../locale');

module.exports = view;

function view(state, emit) {
  const { cooperatives, params: { cooperative: id } } = state;
  const cooperative = cooperatives.find(item => item._id === id);

  if (!cooperative) {
    emit('cooperative:fetch', id);
  }

  return html`
    <div class="App">
      ${ error(state, emit) }
      ${ header(state, emit) }
      <div class="App-container App-container--sm u-block">
        <h1 class="Display Display--2 u-marginTl u-marginBb">${ __('Add energy action') }</h1>
        <a class="u-inlineBlock u-marginBm" href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>

        ${ cooperative ? form({ cooperative: cooperative._id }, emit) : html`
          <div class="u-flexGrow1 u-flex u-flexCol u-flexJustifyCenter">
            ${ loader() }
          </div>
        ` }
      </div>
    </div>
  `;
}

view.title = () => __('Add energy action');
