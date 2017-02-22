const html = require('choo/html');
const moment = require('moment');
const header = require('../components/page-head');
const { defintion } = require('../components/list');
const footer = require('../components/app/footer');
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

  return html`
    <div class="App">
      ${ header(state, prev, send) }

      <div class="App-container">
        <h1 class="u-textM u-marginVs">${ action.name }</h1>
        <a href=${ resolve(`/cooperatives/${ cooperativeId }`) }>
          ${ chevron('left') }${ __('Back to %s', cooperative.name) }
        </a>

        <div class="u-hiddenTargetComplex u-marginTm" id="form-${ actionId }">
          <div class="u-hiddenTargetSlave">
            ${ defintion(properties(action)) }
          </div>

          ${ state.user ? html`<div class="u-hiddenComplexTarget">${ form(action) }</div>` : null }
          ${ state.user ? html`<a class="Button u-block u-marginVs u-hiddenTargetSlave" href="#form-${ actionId }">${ __('Edit energy action') }</a>` : null }
        </div>

      </div>

      ${ footer(state, prev, send) }
    </div>
  `;
};

function form(action) {
  return html`
    <form action="" method="PUT" class="Form">
      <div class="Form-input">
        <label class="Form-label">${ __n('Category') }</label>
        <select class="Form-select Form-select--multiple" multiple>
          ${ TYPES.map(type => html`
            <option selected=${ action.types.includes(type) } value=${ type }>
              ${ __(`ACTION_TYPE_${ type }`) }
            </option>
          `) }
        </select>
      </div>
      <div class="Form-input">
        <label class="Form-label">${ __('Date') }</label>
        <input type="date" class="Form-date" value=${ moment(action.date).format('YYYY-MM-DD') } />
      </div>
      <div class="Form-input">
        <label class="Form-label">${ __('Cost') }</label>
        <input type="text" class="Form-text" value=${ action.cost } />
        <span class="Form-suffix">kr</span>
      </div>
      <div class="Form-input">
        <label class="Form-label">${ __('Description') }</label>
        <textarea rows="3" class="Form-text">${ action.description }</textarea>
      </div>

      <button type="submit" class="Button">${ __('Save') }</button>
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
