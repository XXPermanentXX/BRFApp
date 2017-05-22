const html = require('choo/html');
const moment = require('moment');
const { __ } = require('../../locale');

const DATE_FORMAT = 'YYYY-MM-DD';
const TYPES = [ 100, 101, 102, 103, 105, 106, 200, 201, 202, 203, 204, 205, 206, 300, 301, 302 ];

module.exports = function action(action, onsave) {
  return html`
    <form action="/actions${ action._id ? `/${ action._id }` : '' }" method="POST" class="Form" enctype="application/x-www-form-urlencoded" onsubmit=${ onsubmit }>
      ${ action._id ? html`
        <input type="hidden" name="_method" value="PUT" />
      ` : html`
        <input type="hidden" name="cooperative" value=${ action.cooperative } />
      ` }

      <div class="Form-collapse u-marginBb">

        <label class="Form-item">
          <span class="Form-label">${ __('Action') }</span>
          <select class="Form-select" name="type" required>
            ${ TYPES.filter(type => (type % 100) === 0).map(category => html`
              <optgroup label=${ __(`ACTION_TYPE_${ category }`) }>
                ${ TYPES.filter(type => type > category && type < category + 100).map(type => html`
                  <option selected=${ action ? (action.type === type || false) : false } value=${ type }>
                    ${ __(`ACTION_TYPE_${ type }`) }
                  </option>
                `) }
              </optgroup>
            `) }
          </select>
        </label>

        <label class="Form-item">
          <span class="Form-label">${ __('Date') }</span>
          <input type="date" class="Form-input Form-input--date" name="date" required value=${ action ? moment(action.date).format(DATE_FORMAT) : '' } />
        </label>

        <label class="Form-item">
          <span class="Form-label">${ __('Cost') }</span>
          <input type="number" class="Form-input Form-input--number" name="cost" value=${ (action && action.cost) || '' } />
          <span class="Form-suffix">kr</span>
        </label>

        <label class="Form-item">
          <span class="Form-label">${ __('Description') }</span>
          <textarea rows="3" class="Form-input" name="description">${ (action && action.description) || '' }</textarea>
        </label>
      </div>

      <button type="submit" class="Button u-block u-sizeFull">${ __('Save') }</button>
    </form>
  `;

  function onsubmit(event) {
    if (typeof onsave === 'function') {
      onsave(new FormData(event.target));
      event.preventDefault();
    }
  }
};
