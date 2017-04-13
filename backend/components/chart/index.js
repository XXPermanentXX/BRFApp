const html = require('choo/html');
const moment = require('moment');
const hash = require('object-hash');
const createContainer = require('./container');
const form = require('./form');
const { loader, chevron } = require('../icons');
const { __ } = require('../../locale');

const SELECTED_COOPERATIVE = /cooperative:(\w+)/;

const container = createContainer();
let isInitialized = false;

module.exports = function createChart(onpaginate) {
  const paginate = diff => () => onpaginate(diff);

  return (center, cooperative, actions, state, emit) => {
    if (typeof window === 'undefined') {
      return loading();
    }

    const { type, granularity, compare, items } = state.consumptions;

    /**
     * Figure out where (when) to center the graph
     */

    const offset = moment(center).diff(Date.now(), granularity);
    const now = offset > -6 ? moment().add(offset, granularity) : moment(center).add(6 - Math.abs(offset), granularity);

    let queries = [];
    queries.push(Object.assign({
      name: granularity === 'month' ? __('Current year') : cooperative.name,
      type: type,
      cooperative: cooperative._id
    }, getPeriod(granularity, now)));

    if (granularity === 'month' && compare === 'prev_year') {
      const from = moment(queries[0].from).subtract(1, 'month');
      const period = getPeriod(granularity, from);

      queries.push(Object.assign({
        name: __('Previous year'),
        type: type,
        cooperative: cooperative._id
      }, period));
    }

    if (SELECTED_COOPERATIVE.test(compare)) {
      const id = compare.match(SELECTED_COOPERATIVE)[1];
      const other = state.cooperatives.find(item => item._id === id);

      // Ensure tht primary serie is labeled by name and not 'Current year'
      queries[0].name = cooperative.name;

      // Have other cooperative inherit period from primary serie
      queries.push(Object.assign({}, queries[0], {
        cooperative: id,
        name: other.name
      }));
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

    const actionSerie = [];
    actions
      // Filter out only those who are within the given time span
      .filter(action => {
        if (!data[0].values.length) { return false; }
        const values = data[0].values;
        const min = moment(values[0].date).startOf(granularity);
        const max = moment(values[values.length - 1].date).endOf(granularity);
        return moment(action.date).isBetween(min, max);
      })
      .forEach((action, index) => {
        // Find closest data point to latch on to
        const date = moment(action.date);
        const point = data[0].values.find(point => {
          return date.isSame(point.date, granularity);
        });

        if (action.merge) {
          // Actions may merge with an associated series point, let's do that
          point.hasAction;
        } else {
          // Or they'll be added to a seperate serie
          actionSerie.push({
            name: index + 1,
            date: action.date,
            value: point.value
          });
        }
      });

    const hasLater = moment(now).isBefore(Date.now(), granularity);
    const hasEarlier = !!data[0].values.length;

    return html`
      <div class="Chart" onload=${ onload }>
        <div class="u-posRelative">
          ${ container(granularity, actionSerie, data) }
          <button class="Chart-paginate Chart-paginate--left" onclick=${ paginate(-1) } disabled=${ !hasEarlier }>
            ${ chevron('left') } <span class="Chart-pageLabel">${ __('Show earlier') }</span>
          </button>
          <button class="Chart-paginate Chart-paginate--right" onclick=${ paginate(1) } disabled=${ !hasLater }>
            <span class="u-floatRight">
              <span class="Chart-pageLabel">${ __('Show more recent') }</span> ${ chevron('right') }
            </span>
          </button>
        </div>
        ${ form(cooperative, state, emit) }
      </div>
    `;

    function loading() {
      return html`
        <div class="Chart" onload=${ onload }>
          ${ loader() }
          ${ form(cooperative, state, emit) }
        </div>
      `;
    }

    function onload() {
      if (!isInitialized) {
        emit('cooperatives:fetch');
        isInitialized = true;
      }
    }
  };
};

/**
 * Calculate yearly consumption by summing up months
 */

function composeYears(data) {
  return data.reduce((years, point) => {
    // Get last year in list
    const year = years[years.length - 1];

    if (year && (year.date.getFullYear() === point.date.getFullYear())) {
      year.value += point.value;
    } else {
      years.push({
        date: moment(point.date).endOf('year').toDate(),
        value: point.value
      });
    }

    return years;
  }, []);
}

/**
 * Calculate from and to based on granularity
 */

function getPeriod(granularity, now = Date.now()) {
  switch (granularity) {
    case 'month': return {
      from: moment(now).subtract(11, 'months').startOf('month').toDate(),
      to: moment(now).endOf('month').toDate()
    };
    case 'year': return {
      from: moment(now).subtract(11, 'years').startOf('year').toDate(),
      to: moment(now).endOf('year').toDate()
    };
    default: throw (new Error(`Granularity "${ granularity }" not supported`));
  }
}
