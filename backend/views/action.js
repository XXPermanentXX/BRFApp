const html = require('choo/html');
const moment = require('moment');
const header = require('../components/page-head');
const { defintion } = require('../components/list');
const footer = require('../components/app/footer');
const comment = require('../components/comment');
const resolve = require('../resolve');
const { chevron, loader } = require('../components/icons');
const { format, capitalize, className } = require('../components/utils');
const { __, __n } = require('../locale');

const IS_LIVE = typeof window !== 'undefined';
const TYPES = [ 100, 101, 102, 103, 105, 106, 200, 201, 202, 203, 204, 205, 206, 300, 301, 302 ];

module.exports = function (state, prev, send) {
  const { cooperatives, actions, location: { params }} = state;
  const action = actions.items.find(props => props._id === params.action);

  if (!action) {
    send('actions:fetch', params.action);
    return loading(state, prev, send);
  }

  const cooperative = cooperatives.items.find(props => props._id === action.cooperative);
  if (!cooperative) {
    send('cooperatives:fetch', action.cooperative);
    return loading(state, prev, send);
  }

  return html`
    <div class="App">
      ${ header(state, prev, send) }

      <div class="App-container">
        <h1 class="Display Display--4">${ action.name }</h1>
        <a href=${ resolve(`/cooperatives/${ cooperative._id }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>

        <div class=${ className('u-marginTm u-marginBl', { 'u-hiddenTargetComplex': !IS_LIVE }) } id="form-${ action._id }">
          ${ !IS_LIVE || state.actions.isEditing !== action._id ? html`
            <div class=${ className({ 'u-hiddenTargetSlave': !IS_LIVE }) } id="details-${ action._id }">
              ${ defintion(properties(action)) }
            </div>
          ` : null }

          ${ state.user._id && (!IS_LIVE || state.actions.isEditing === action._id) ? html`
            <div class=${ className({ 'u-hiddenComplexTarget': !IS_LIVE }) }>
              ${ form(action, toggleForm(false)) }
            </div>
          ` : null }


          ${ state.user._id && (!IS_LIVE || state.actions.isEditing !== action._id) ? html`
            <a  href="#form-${ action._id }"
              data-no-routing="true"
              onclick=${ toggleForm(true) }
              class=${ className('Button u-block u-marginVs', { 'u-hiddenTargetSlave': !IS_LIVE }) }>
              ${ __('Edit energy action') }
            </a>
          ` : null }
        </div>

        <div id="comments-${ action._id }">
          <h2 class="Display Display--3 u-textItalic">
            ${ action.comments.length ? __n('Comment', 'Comments', action.comments.length) : __('No comments yet') }
          </h2>

          <ol class="List u-marginVm">
            ${ action.comments.map(props => html`<li>${ comment(props, action, state) }</li>`) }
          </ol>

          ${ state.user._id ? html`
            <form action="${ action._id }/comments" method="POST" class="Form">
              <div class="Form-grid u-marginBb">
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

      ${ footer(state, prev, send) }
    </div>
  `;

  function toggleForm(toggle) {
    return event => {
      if (toggle) {
        send('actions:edit', action._id);
      } else {
        send('actions:cancel');
      }

      event.preventDefault();
    };
  }
};

function form(action, cancel) {
  return html`
    <form action="" method="POST" class="Form" enctype="application/x-www-form-urlencoded">
      <input type="hidden" name="_method" value="PUT">
      <div class="Form-grid u-marginBb">
        <label class="Form-item">
          <span class="Form-label">${ __('Name') }</span>
          <input type="text" class="Form-input" name="name" value=${ action.name } />
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __n('Category', 'Categories', TYPES.length) }</span>
          <select class="Form-select Form-select--multiple" name="types" multiple>
            ${ TYPES.filter(type => (type % 100) === 0).map(category => html`
              <optgroup label=${ __(`ACTION_TYPE_${ category }`) }>
                <option selected=${ action.types.includes(category) } value=${ category }>
                  ${ __(`ACTION_TYPE_${ category }`) }
                </option>
                ${ TYPES
                    .filter(type => type > category && type < category + 100)
                    .map(type => html`
                      <option selected=${ action.types.includes(type) } value=${ type }>
                        ${ __(`ACTION_TYPE_${ type }`) }
                      </option>
                `) }
              </optgroup>
            `) }
          </select>
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __('Date') }</span>
          <input type="date" class="Form-input Form-input--date" name="date" value=${ moment(action.date).format('YYYY-MM-DD') } />
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __('Cost') }</span>
          <input type="number" class="Form-input Form-input--number" name="cost" value=${ action.cost || '' } />
          <span class="Form-suffix">kr</span>
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __('Description') }</span>
          <textarea rows="3" class="Form-input" name="description">${ action.description }</textarea>
        </label>
      </div>

      <a href="#details-${ action._id }" data-no-routing="true" onclick=${ cancel } class="Button Button--secondary u-block u-marginBb">${ __('Cancel') }</a>
      <button type="submit" class="Button u-block u-sizeFull">${ __('Save') }</button>
    </form>
  `;
}

function loading(state, prev, send) {
  return html`
    <div class="App">
      ${ header(state, prev, send) }
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
