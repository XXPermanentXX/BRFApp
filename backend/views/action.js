const html = require('choo/html');
const moment = require('moment');
const header = require('../components/page-head');
const { definition } = require('../components/list');
const chart = require('../components/chart');
const footer = require('../components/app/footer');
const comment = require('../components/comment');
const resolve = require('../resolve');
const { chevron, loader } = require('../components/icons');
const { format, capitalize } = require('../components/utils');
const { __, __n } = require('../locale');

module.exports = function (state, emit) {
  const { cooperatives, actions, params } = state;
  const action = actions.find(props => props._id === params.action);

  if (!action) {
    emit('actions:fetch', params.action);
    return loading(state, emit);
  }

  const cooperative = cooperatives.find(props => props._id === action.cooperative);
  if (!cooperative) {
    emit('cooperatives:fetch', action.cooperative);
    return loading(state, emit);
  }

  return html`
    <div class="App">
      ${ header(state, emit) }

      <div class="App-container u-flexInitial">
        <h1 class="Display Display--4">${ action.name }</h1>
        <a href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>
      </div>

      <div class="u-marginVm">
        ${ chart(Date.parse(action.date), cooperative, [Object.assign({title: ''}, action)], state, emit) }
      </div>

      <div class="App-container">
        ${ definition(properties(action)) }

        ${ state.user ? html`
          <a href="/actions/${ action._id }/edit" class="Button u-block u-marginVs">
            ${ __('Edit energy action') }
          </a>
        ` : null }

        <div id="comments-${ action._id }">
          <h2 class="Display Display--3 u-textItalic">
            ${ action.comments.length ? __n('Comment', 'Comments', action.comments.length) : __('No comments yet') }
          </h2>

          <ol class="List u-marginVm">
            ${ action.comments.map(props => html`<li>${ comment(props, action, state) }</li>`) }
          </ol>

          ${ state.user ? html`
            <form action="${ action._id }/comments" method="POST" class="Form">
              <div class="Form-collapse u-marginBb">
                <label class="Form-item">
                  <span class="Form-label">${ __('Leave a comment') }</span>
                  <textarea name="comment" rows="3" class="Form-input"></textarea>
                </label>
              </div>
              <button type="submit" class="Button u-block u-sizeFull">${ __('Post') }</button>
            </form>
          ` : null }
        </div>

      </div>

      ${ footer(state, emit) }
    </div>
  `;
};

function loading(state, emit) {
  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container">
        ${ loader() }
      </div>
    </div>
  `;
}

function properties(action) {
  const types = action.types.map(type => __(`ACTION_TYPE_${ type }`)).join(', ');
  const props = {
    [__n('Category', 'Categories', action.types.length)]: types,
    [__('Date')]: capitalize(moment(action.date).format('MMMM YYYY'))
  };

  if (action.cost) {
    props[__('Cost')] = `${ format(action.cost) }kr`;
  }

  if (action.description) {
    props[__('Description')] = action.description;
  }

  return props;
}
