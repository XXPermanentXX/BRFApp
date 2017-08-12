const html = require('choo/html');
const moment = require('moment');
const hash = require('object-hash');
const createChart = require('./chart');
const form = require('./form');
const { loader, chevron } = require('../icons');
const { className } = require('../utils');
const { __ } = require('../../locale');

const SELECTED_COOPERATIVE = /cooperative:(\w+)/;

module.exports = function createWrapper(name) {
  let element;
  const chart = createChart(name);

  return function render(header, center, cooperative, actions, state, emit) {
    if (typeof window === 'undefined') {
      return empty(html`
        <div>
          <div class="u-hiddenNoScript">${ loader() }</div>
          <div class="u-hiddenHasScript">
            ${ __('There would be a pretty chart here, had you enabled JavaScript') }
          </div>
        </div>
      `);
    }

    const { page, inEdit } = state.chart;
    const { granularity, items, normalized, type, compare } = state.consumptions;

    /**
     * Figure out where (when) to center the graph
     */

    const offset = Math.round(moment(center).diff(Date.now(), granularity, true));
    const now = offset < -6 ?
      moment(center).add(page + 5, granularity) :
      moment(center).add(page + Math.abs(offset), granularity);

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
      if (!state.error) {
        emit('consumptions:fetch', queries);
      }

      if (page !== 0) {
        isLoading = true;
      } else {
        return empty(loader());
      }
    }

    /**
     * Compose Monthly values into years
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
      if (!series[0].values.length) {
        element = html`
          <div class="u-flexExpand">
            <em>${ __('No data') }</em>
          </div>
        `;
      } else {
        element = chart(granularity, formatActions(actions, series, granularity), series);
      }
    }

    return html`
      <div class="${ className('Chart', { 'is-loading': isLoading }) }">
        <div class="Chart-header">
          <div class="Chart-title">
            ${ header }
          </div>
          <div class="Chart-filter">
            <!-- Toggle form/summary view -->
            ${ inEdit ? form(cooperative, state, emit) : html`
              <div class="Chart-summary">
                <button class="Button Button--round Button--inverse u-marginLs u-floatRight" onclick=${ () => emit('chart:edit') }>
                  ${ __('Edit') }
                </button>

                <!-- Compiled summary of current filter settings -->
                <strong>${ __('Showing') }: </strong>
                ${ __('Energy use').toLowerCase() + ' ' }
                <em>${ normalized ? ` (${ __('normalized') })` : '' }</em>
                ${ __('for') + ' ' }
                <em>${ getType(cooperative, type).toLowerCase() + ' ' }</em>
                ${ __('per') + ' ' }
                <em>${ __(granularity) + ' ' }</em>
                ${ compare ? html`
                  <span>
                    ${ __('compared with') + ' ' }
                    <em>${ compare === 'prev_year' ?
                      __('Previous year').toLowerCase() :
                      state.cooperatives.find(item => item._id === compare).name
                    }</em>
                  </span>
                ` : null }
              </div>
            ` }
          </div>
        </div>
        <div class="Chart-graph">
          <span class="Chart-legend">
            ${ getType(cooperative, type) } (kWh/m<sup>2</sup>)
          </span>

          <!-- Cached container element -->
          ${ element }

          <!-- Paginate buttons -->
          <button class="Chart-paginate Chart-paginate--left" onclick=${ () => emit('chart:paginate', -1) } disabled=${ !hasEarlier }>
            ${ chevron('left') } <span class="Chart-pageLabel">${ __('Show earlier') }</span>
          </button>
          <button class="Chart-paginate Chart-paginate--right" onclick=${ () => emit('chart:paginate', 1) } disabled=${ !hasLater }>
            <span class="u-floatRight">
              <span class="Chart-pageLabel">${ __('Show more recent') }</span> ${ chevron('right') }
            </span>
          </button>
        </div>
      </div>
    `;

    /**
     * Simple no fuzz loading state
     */

    function empty(content) {
      return html`
        <div class="Chart">
          <div class="Chart-header">
            <div class="Chart-title">
              ${ header }
            </div>
          </div>
          <div class="Chart-graph u-flex u-flexJustifyCenter u-flexAlignItemsCenter u-paddingVl">
            ${ content }
          </div>
        </div>
      `;
    }
  };
};


/**
 * Format type depending on whether consumption includes households' electricity
 */

function getType(cooperative, type) {
  const { incHouseholdElectricity } = cooperative;
  const addSuffix = type === 'electricity' && incHouseholdElectricity;
  return addSuffix ? __('%s incl. households', __(type)) : __(type);
}

/**
 * Compile queries for fetching consumption data
 */

function getQueries(now, cooperative, state) {
  const { granularity, type, compare, normalized } = state.consumptions;

  const queries = [];
  queries.push(Object.assign({
    name: compare === 'prev_year' ? __('Current year') : cooperative.name,
    types: [ type ],
    normalized: normalized,
    cooperative: cooperative._id
  }, getPeriod(granularity, now)));

  if (granularity === 'month' && compare === 'prev_year') {
    const from = moment(queries[0].from).subtract(1, 'month');
    const period = getPeriod(granularity, from);

    queries.push(Object.assign({
      name: __('Previous year'),
      types: [ type ],
      normalized: normalized,
      cooperative: cooperative._id
    }, period));
  }

  if (SELECTED_COOPERATIVE.test(compare)) {
    const id = compare.match(SELECTED_COOPERATIVE)[1];
    const other = state.cooperatives.find(item => item._id === id);
    const { incHouseholdElectricity } = cooperative;
    const diff = incHouseholdElectricity !== other.incHouseholdElectricity;
    let name = other.name;

    if (diff && other.incHouseholdElectricity) {
      name = __('%s incl. households', name);
    }

    // Ensure that primary serie is labeled by name and not 'Current year'
    queries[0].name = cooperative.name;

    if (diff && incHouseholdElectricity) {
      queries[0].name = __('%s incl. households', queries[0].name);
    }

    // Have other cooperative inherit period from primary serie
    queries.push(Object.assign({}, queries[0], {
      cooperative: id,
      name: name
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
      const point = values.find(point => date.isSame(point.date, granularity));

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
        date: moment(point.date).startOf('year').toDate(),
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
      to: moment(now).subtract(1, 'year').endOf('year').toDate()
    };
    default: throw (new Error(`Granularity "${ granularity }" not supported`));
  }
}
