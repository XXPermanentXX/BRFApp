const html = require('choo/html');
const moment = require('moment');
const hash = require('object-hash');
const createChart = require('./chart');
const form = require('./form');
const { loader, chevron } = require('../icons');
const { className } = require('../utils');
const { __ } = require('../../locale');

const SELECTED_COOPERATIVE = /cooperative:(\w+)/;

const chart = createChart();
let isInitialized = false;

module.exports = function createChart() {
  let current, element;
  let page = 0;

  return function render(center, cooperative, actions, state, emit) {
    if (typeof window === 'undefined') {
      return loading();
    }

    if (cooperative._id !== current) {
      page = 0;
      current = cooperative._id;
    }

    const { granularity, items } = state.consumptions;

    /**
     * Figure out where (when) to center the graph
     */

    const offset = Math.abs(Math.round(moment(center).diff(Date.now(), granularity, true)));
    const now = offset < -6 ?
      moment(center).add(page, granularity) :
      moment(center).add(page + offset, granularity);

    /**
     * Lookup cached data
     */

    const series = [];
    const queries = getQueries(now, cooperative, state).reduce((missing, query) => {
      const cached = items[hash(query)];

      if (cached) {
        series.push({ name: query.name, values: cached });
        return missing;
      }

      return missing.concat([query]);
    }, []);

    /**
     * Fetch any data that might be missing and render loading state
     */

    let isLoading = false;
    if (queries.length) {
      emit('consumptions:fetch', queries);

      if (page !== 0) {
        isLoading = true;
      } else {
        return loading();
      }
    }

    /**
     * Compose montly values into years
     */

    if (granularity === 'year') {
      series.forEach(set => { set.values = composeYears(set.values); });
    }

    /**
     * Find the shortest series set
     */

    const max = series.reduce((max, set) => {
      return !max || (set.values.length < max) ? set.values.length : max;
    }, 0);

    /**
     * Ensure all series sets are the same length
     */

    series.forEach(set => { set.values = set.values.slice(max * -1); });

    const hasLater = moment(now).isBefore(Date.now(), granularity);
    const hasEarlier = series.length && series[0].values.length;

    /**
     * Only update the chart if the application is not loading
     */

    if (!isLoading) {
      element = chart(granularity, formatActions(actions, series, granularity), series);
    }

    return html`
      <div class=${ className('Chart', { 'is-loading': isLoading }) } onload=${ onload }>
        <div class="u-posRelative">
          <div class="Chart-graph">
            ${ element }
          </div>
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

    /**
     * Increment/decrement current page value and issue a re-render
     */

    function paginate (diff) {
      return () => {
        page += diff;
        emit('render');
      };
    }

    /**
     * Simple no fuzz loading state
     */

    function loading() {
      return html`
        <div class="Chart" onload=${ onload }>
          ${ loader() }
          ${ form(cooperative, state, emit) }
        </div>
      `;
    }

    /**
     * Fetch all cooperatives on first load as they are needed for comparing
     */

    function onload() {
      if (!isInitialized) {
        emit('cooperatives:fetch');
        isInitialized = true;
      }
    }
  };
};

/**
 * Compile queries for fetching consumption data
 */

function getQueries(now, cooperative, state) {
  const { granularity, type, compare } = state.consumptions;

  const queries = [];
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

  return queries;
}

/**
 * Compile actions for data set period
 */

function formatActions(actions, series, granularity) {
  if (!series.length || !series[0].values.length) { return []; }

  const points = [];
  const values = series[0].values;

  actions
    // Filter out only those who are within the given time span
    .filter(action => {
      const min = moment(values[0].date).startOf(granularity);
      const max = moment(values[values.length - 1].date).endOf(granularity);
      return moment(action.date).isBetween(min, max);
    })
    .forEach((action, index) => {
      // Find closest data point to latch on to
      const date = moment(action.date);
      const point = values.find(point => {
        return date.isSame(point.date, granularity);
      });

      if (action.merge) {
        // Actions may merge with an associated series point, let's do that
        point.hasAction = true;
      } else {
        // Or they'll be added to a seperate serie
        points.push({
          name: index + 1,
          date: action.date,
          value: point.value
        });
      }
    });

  return points;
}

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
