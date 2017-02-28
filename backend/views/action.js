const html = require('choo/html');
const moment = require('moment');
const header = require('../components/page-head');
const { defintion } = require('../components/list');
const footer = require('../components/app/footer');
const comment = require('../components/action/comment');
const resolve = require('../resolve');
const { chevron } = require('../components/icons');
const { format } = require('../components/utils');
const { __, __n } = require('../locale');

const TYPES = [ 100, 101, 102, 103, 105, 106, 200, 201, 202, 203, 204, 205, 206, 300, 301, 302 ];

module.exports = function (state, prev, send) {
  const {
    cooperatives, actions,
    location: { params: { action: actionId, cooperative: cooperativeId }}
  } = state;
  const cooperative = cooperatives.find(props => props._id.toString() === cooperativeId);
  const action = actions.find(props => props._id.toString() === actionId);
  const { comments } = action;

  return html`
    <div class="App">
      ${ header(state, prev, send) }

      <div class="App-container">
        <h1 class="Display Display--4">${ action.name }</h1>
        <a href=${ resolve(`/cooperatives/${ cooperativeId }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>

        <div class="u-hiddenTargetComplex u-marginTm u-marginBl" id="form-${ actionId }">
          <div class="u-hiddenTargetSlave" id="details-${ actionId }">
            ${ defintion(properties(action)) }
          </div>

          ${ state.user ? html`
            <div class="u-hiddenComplexTarget">
              ${ form(action) }
            </div>
          ` : null }

          ${ state.user ? html`
            <a class="Button u-block u-marginVs u-hiddenTargetSlave" href="#form-${ actionId }">
              ${ __('Edit energy action') }
            </a>
          ` : null }
        </div>

        <div id="comments-${ action._id }">
          <h2 class="Display Display--3 u-textItalic">
            ${ comments.length ? __n('Comment', 'Comments', comments.length) : __('No comments yet') }
          </h2>

          ${ comments.length ? html`
            <ol class="List">
            ${ comments.map(props => html`<li>${ comment(props) }</li>`) }
            </ol>
          ` : html`
              <form action="comments" method="POST" class="Form">
                <div class="Form-grid u-marginBb">
                  <label class="Form-item">
                    <span class="Form-label">${ __('Leave a comment') }</span>
                    <textarea rows="3" class="Form-input"></textarea>
                  </label>
                </div>
                <button type="submit" class="Button u-block u-sizeFull">${ __('Post') }</button>
              </form>
          ` }
        </div>

      </div>

      ${ footer(state, prev, send) }
    </div>
  `;
};

function form(action) {
  return html`
    <form action="" method="PUT" class="Form">
      <div class="Form-grid u-marginBb">
        <label class="Form-item">
          <span class="Form-label">${ __n('Category', 'Categories', TYPES.length) }</span>
          <select class="Form-select Form-select--multiple" multiple>
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
          <input type="date" class="Form-input Form-input--date" value=${ moment(action.date).format('YYYY-MM-DD') } />
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __('Cost') }</span>
          <input type="text" class="Form-input" value=${ action.cost || '' } />
          <span class="Form-suffix">kr</span>
        </label>
        <label class="Form-item">
          <span class="Form-label">${ __('Description') }</span>
          <textarea rows="3" class="Form-input">${ action.description }</textarea>
        </label>
      </div>

      <a href="#details-${ action._id }" class="Button Button--secondary u-block u-marginBb">${ __('Cancel') }</a>
      <button type="submit" class="Button u-block u-sizeFull">${ __('Save') }</button>
    </form>
  `;
}

function properties(action) {
  const types = action.types.map(type => __(`ACTION_TYPE_${ type }`)).join(', ');
  const props = {
    [__n('Category', 'Categories', action.types.length)]: types,
    [__('Date')]: moment(action.date).format('MMMM YYYY')
  };

  if (action.cost) {
    props[__('Cost')] = `${ format(action.cost) }kr`;
  }

  if (action.description) {
    props[__('Description')] = action.description;
  }

  return props;
}
