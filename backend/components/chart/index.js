const html = require('choo/html');
const moment = require('moment');
const hash = require('object-hash');
const createContainer = require('./container');
const form = require('./form');
const { loader } = require('../icons');
const { __ } = require('../../locale');

const container = createContainer();

module.exports = function render(cooperative, state, emit) {
  if (!state.consumptions) {
    return loading();
  }

  const { type, granularity, compare, items } = state.consumptions;

  let queries = [];
  queries.push(Object.assign({
    name: granularity === 'month' ? __('Current year') : cooperative.name,
    type: type,
    cooperative: cooperative._id
  }, getPeriod(granularity, moment().subtract(1, 'month'))));

  if (granularity === 'month' && compare === 'prev_year') {
    const from = moment(queries[0].from).subtract(1, 'month');
    const period = getPeriod(granularity, from);

    queries.push(Object.assign({
      name: __('Previous year'),
      type: type,
      cooperative: cooperative._id
    }, period));
  }

  /**
   * Add cached data to dataset and remove it from query list
   */

  let data = [];
  queries = queries.reduce((missing, query) => {
    const cache = items[hash(query)];

    if (cache) {
      data.push({ name: query.name, values: cache });
      return missing;
    }

    return missing.concat([query]);
  }, []);

  /**
   * Fetch any data that might be missing
   */

  if (queries.length) {
    emit('consumptions:fetch', queries);
    return loading();
  }

  /**
   * Compose montly values into years
   */

  if (granularity === 'year') {
    data = data.map(set => ({
      name: set.name,
      values: composeYears(set.values)
    }));
  }

  /**
   * Find the shortest data set
   */

  const max = data.reduce((max, set) => {
    return !max || (set.values.length < max) ? set.values.length : max;
  }, 0);

  /**
   * Ensure all data sets are the same length
   */

  data.forEach(set => { set.values = set.values.slice(max * -1); });

  /**
   * Compile actions for data set period
   */

  const actions = state.actions
    // Find cooperative's actions
    .filter(action => action.cooperative === cooperative._id)
    // Filter out only those who are within given time span
    .filter(action => {
      const min = data[0].values[0].date;
      const max = data[0].values[data[0].values.length - 1].date;
      return moment(action.date).isBetween(min, max);
    })
    // Put together a chart compatible object
    .map((action, index) => {
      const match = data[0].values.findIndex(point => {
        return new Date(point.date) > new Date(action.date);
      });

      return {
        name: index + 1,
        date: data[0].values[match - 1].date,
        value: data[0].values[match - 1].value
      };
    });

  return html`
    <div class="Chart">
      ${ container(granularity, actions, data) }
      ${ form(state.consumptions, emit) }
    </div>
  `;
};

function composeYears(data) {
  return data.reduce((years, point) => {
    const year = years[years.length - 1];

    if (year && moment(year.date).isSame(point.date, 'year')) {
      year.value += point.value;
    } else {
      years.push({
        date: moment(point.date).startOf('year').toJSON(),
        value: point.value
      });
    }

    return years;
  }, []);
}

function getPeriod(granularity, now = Date.now()) {
  switch (granularity) {
    case 'month': return {
      from: moment(now).subtract(11, 'months').startOf('month').toJSON(),
      to: moment(now).endOf('month').toJSON()
    };
    case 'year': return {
      from: moment(now).subtract(11, 'years').startOf('year').toJSON(),
      to: moment(now).endOf('year').toJSON()
    };
    default: throw (new Error(`Granularity "${ granularity }" not supported`));
  }
}

function loading(props = { disabled: true }) {
  return html`
    <div class="Chart">
      ${ loader() }
      ${ form(props) }
    </div>
  `;
}
