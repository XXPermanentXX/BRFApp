const html = require('choo/html');
const moment = require('moment');
const createContainer = require('./container');
const { loader } = require('../icons');
const { __ } = require('../../locale');

const TYPES = [ 'heating', 'electricity' ];
const COMPERATIVE = [ 'prev_year', 'average' ];
const STRINGS = {
  'prev_year': 'Previous year',
  'average': 'Neighborhood average',
  'heating': 'Heating & Hot water',
  'electricity': 'Electricity'
};

const container = createContainer();

module.exports = function chart(cooperative, state, prev, send) {
  /**
   * Construct query objects that also works as cache keys
   */

  const queries = {};
  queries.current = {
    type: state.consumptions.type,
    granularity: state.consumptions.granularity,
    from: moment().subtract(1, 'year').startOf('month').toJSON(),
    to: moment().endOf('month').toJSON()
  };
  queries.compare = {
    type: state.consumptions.type,
    granularity: state.consumptions.granularity,
    from: moment(queries.current.from).subtract(1, 'year').toJSON(),
    to: moment(queries.current.from).subtract(1, 'month').toJSON()
  };

  const item = state.consumptions.items.find(item => {
    return item.cooperative === cooperative._id;
  });
  const current = item && readCache(item.values, queries.current);
  const compare = item && readCache(item.values, queries.compare);

  const query = [];
  if (!current) {
    query.push(Object.assign({ cooperative }, queries.current));
  }

  if (!compare) {
    query.push(Object.assign({ cooperative }, queries.compare));
  }

  if (query.length) {
    return loading(state, send, () => send('consumptions:fetch', query));
  }

  const actions = state.actions.items
    // Find cooperative's actions
    .filter(action => action.cooperative === cooperative._id)
    // Filter out only those who are within given time span
    .filter(action => moment(action.date).isBetween(
      queries.current.from,
      queries.current.to
    ))
    // Put together a chart compatible object
    .map((action, index) => {
      const match = current.findIndex(point => {
        return new Date(point.date) > new Date(action.date);
      });

      return {
        name: index + 1,
        date: action.date,
        value: current[match - 1].value
      };
    });

  return html`
    <div class="Chart">
      ${ container(actions, [
        { name: __('Current year'), values: current },
        { name: __('Previous year'), values: compare }
      ]) }
      ${ settings(state, send) }
    </div>
  `;
};

function settings(state, send) {
  return html`
    <form class="Form u-marginTm u-paddingHb u-flex u-flexCol u-flexAlignItemsStretch">
      <div class="Form-grid">
        <label for="form_type" class="Form-label Form-label--pill">${ __('Show') }</label>
        <select id="form_type" class="Form-select Form-select--pill u-marginBb" name="type" onchange=${ setType }>
          ${ TYPES.map(value => html`
              <option value=${ value } selected=${ state.consumptions.type === value }>
                ${ __(STRINGS[value]) }
              </option>
          `) }
        </select>

        <label for="form_compare" class="Form-label Form-label--pill">${ __('Compare with') }</label>
        <select id="form_compare" class="Form-select Form-select--pill" name="compare">
          ${ COMPERATIVE.map(value => html`
              <option value=${ value } selected=${ state.consumptions.compare === value }>
                ${ __(STRINGS[value]) }
              </option>
          `) }
        </select>
      </div>
    </form>
  `;

  function setType(event) {
    send('consumptions:type', event.target.value);
  }
}

function readCache(cache, target) {
  const keys = Object.keys(target);

  const match = Object.keys(cache).find(str => {
    let match = true;
    const attrs = JSON.parse(str);

    for (let key of keys) {
      if (attrs[key] !== target[key]) {
        match = false;
      }
    }

    return match;
  });

  return cache[match];
}

function loading(state, send, onload = null) {
  return html`
    <div class="Chart" onload=${ onload }>
      ${ loader() }
      ${ settings(state, send) }
    </div>
  `;
}
