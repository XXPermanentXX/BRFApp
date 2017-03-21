const html = require('choo/html');
const moment = require('moment');
const hash = require('object-hash');
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
    return loading(state, send, () => send('consumptions:fetch', queries));
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

  const actions = state.actions.items
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
      ${ settings(state, send) }
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

function settings(state, send) {
  return html`
    <form class="Form u-marginTm u-paddingHb u-flex u-flexCol u-flexAlignItemsStretch">
      <fieldset class="u-marginBb">
        <div class="u-flex">
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="granularity" value="month" onchange=${ setGranularity } checked=${ state.consumptions.granularity === 'month' } />
            <span class="Form-label">${ __('Montly') }</span>
          </label>
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="granularity" value="year" onchange=${ setGranularity } checked=${ state.consumptions.granularity === 'year' } />
            <span class="Form-label">${ __('Yearly') }</span>
          </label>
        </div>
      </fieldset>
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

  function setGranularity(event) {
    send('consumptions:granularity', event.target.value);
  }
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

function loading(state, send, onload = null) {
  return html`
    <div class="Chart" onload=${ onload }>
      ${ loader() }
      ${ settings(state, send) }
    </div>
  `;
}
