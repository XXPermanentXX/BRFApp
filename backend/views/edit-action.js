const html = require('choo/html');
const moment = require('moment');
const resolve = require('../resolve');
const header = require('../components/page-head');
const { chevron } = require('../components/icons');
const { __, __n } = require('../locale');

const TYPES = [ 100, 101, 102, 103, 105, 106, 200, 201, 202, 203, 204, 205, 206, 300, 301, 302 ];

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

        <form action="/actions/${ action._id }" method="POST" class="Form" enctype="application/x-www-form-urlencoded">
          <input type="hidden" name="_method" value="PUT">

          <div class="Form-collapse u-marginBb">

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

          <button type="submit" class="Button u-block u-sizeFull">${ __('Save') }</button>
        </form>
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
