const html = require('choo/html');
const moment = require('moment');
const { __ } = require('../../locale');
const { select, input, textarea } = require('../form');

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
        ${ select({ label: __('Action'), name: 'type', required:true, children: TYPES.filter(type => (type % 100) === 0).map(category => ({
          label: __(`ACTION_TYPE_${ category }`),
          children: TYPES.filter(type => type > category && type < category + 100).map(type => ({
            selected: action ? (action.type === type || false) : false,
            value: type,
            label: __(`ACTION_TYPE_${ type }`)
          }))
        }))}) }
        ${ input({ label: __('Date'), type: 'month', name: 'date', required: true, value: action ? moment(action.date).format(DATE_FORMAT) : '' }) }
        ${ input({ label: __('Cost'), type: 'number', name: 'cost', value: ((action && action.cost) || ''), suffix: 'kr' }) }
        ${ textarea({ label: __('Description'), rows: 3, name: 'description', value: ((action && action.description) || '') }) }
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
