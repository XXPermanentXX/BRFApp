const html = require('choo/html');
const moment = require('moment');
const createContainer = require('./container');
const { loader } = require('../icons');
const { __ } = require('../../locale');

const container = createContainer();

module.exports = function chart(cooperative, state, prev, send) {
  /**
   * Construct query objects that also works as cache keys
   */

  const queries = {};
  queries.current = {
    granularity: 'month',
    from: moment().subtract(1, 'year').startOf('month').toDate(),
    to: moment().endOf('month').toDate()
  };
  queries.compare = {
    granularity: 'month',
    from: moment(queries.current.from).subtract(1, 'year').toDate(),
    to: moment(queries.current.from).subtract(1, 'month').toDate()
  };

  const item = state.consumptions.items.find(item => {
    return item.cooperative === cooperative._id;
  });
  const current = item && item.values[JSON.stringify(queries.current)];
  const compare = item && item.values[JSON.stringify(queries.compare)];

  const query = [];
  if (!current) {
    query.push(Object.assign({ cooperative }, queries.current));
  }

  if (!compare) {
    query.push(Object.assign({ cooperative }, queries.compare));
  }

  if (query.length) {
    if (!state.consumptions.isLoading) {
      return loading(() => send('consumptions:fetch', query));
    }

    return loading();
  }

  const actions = state.actions.items
    .filter(action => action.cooperative === cooperative._id)
    .filter(action => moment(action.date).isBetween(queries.current.from, queries.current.to))
    .map((action, index) => ({
      name: index + 1,
      date: action.date,
      value: current[current.findIndex(point => new Date(point.date) > new Date(action.date)) - 1].value
    }));

  return html`
    <div class="Chart">
      ${ container(actions, [
        { name: __('Current year'), values: current },
        { name: __('Previous year'), values: compare }
      ]) }
    </div>
  `;
};

function loading(onload = null) {
  return html`
    <div class="Chart" onload=${ onload }>
      ${ loader() }
    </div>
  `;
}
