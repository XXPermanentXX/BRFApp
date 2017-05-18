const html = require('choo/html');
const moment = require('moment');
const capitalize = require('lodash.capitalize');
const header = require('../components/page-head');
const { definition } = require('../components/list');
const createChart = require('../components/chart');
const footer = require('../components/app/footer');
const comment = require('../components/comment');
const resolve = require('../resolve');
const { chevron, loader } = require('../components/icons');
const { format } = require('../components/utils');
const { __, __n } = require('../locale');

const chart = createChart();

module.exports = view;

function view(state, emit) {
  const { cooperatives, actions, params, user } = state;
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

      <div class="App-container">
        <div class="App-part App-part--primary u-marginBm">
          <!-- Small viewport: page title -->
          <header class="u-marginVm u-paddingHb u-md-hidden u-lg-hidden">
            <h1 class="Display Display--5">${ action.name }</h1>
            <a href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
              ${ chevron('left') }${ __('Back to %s', cooperative.name) }
            </a>
          </header>

          <!-- The chart -->
          ${ chart(html`
            <div class="u-marginBb">
              <h1 class="Display Display--4 u-marginBb u-textNowrap">
                ${ action.name }
              </h1>
              <a class="u-colorCurrent" href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
                ${ chevron('left') }${ __('Back to %s', cooperative.name) }
              </a>
            </div>`, Date.parse(action.date), cooperative, [Object.assign({merge: true}, action)], state, emit) }
        </div>

        <div class="App-part App-part--secondary App-part--last u-marginBm">
          <!-- Action details -->
          <div class="Sheet Sheet--conditional Sheet--md Sheet--lg">
            ${ definition(properties(action)) }

            ${ user.isAuthenticated ? html`
              <a href=${ resolve(`/actions/${ action._id }/edit`) } class="Button u-block u-marginVs">
                ${ __('Edit energy action') }
              </a>
            ` : null }
          </div>
        </div>

        <!-- Comments -->
        <div class="App-part App-part--secondary u-marginBm" id="comments-${ action._id }">
          <h2 class="Display Display--4 u-marginBb u-textItalic">
            ${ action.comments.length ? __n('Comment', 'Comments', action.comments.length) : __('No comments yet') }
          </h2>

          <ol class="List u-marginVm">
            ${ action.comments.map(props => html`<li>${ comment(props, action, state) }</li>`) }
          </ol>

          <!-- Comment form -->
          ${ user.isAuthenticated ? html`
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
}

view.title = function (state) {
  const action = state.actions.find(item => item._id === state.params.action);

  if (action) {
    return action.name;
  }
};

function loading(state, emit) {
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
