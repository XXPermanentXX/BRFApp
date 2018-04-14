const moment = require('moment')
const html = require('choo/html')
const hash = require('object-hash')
const Component = require('choo/component')
const { __ } = require('../../locale')
const { chevron } = require('../icons')
const ChartFilter = require('./filter')
const Highchart = require('./highchart')
const { className, getPerformance } = require('../utils')

const SELECTED_COOPERATIVE = /cooperative:(\w+)/

module.exports = class Chart extends Component {
  constructor (id, state, emit) {
    super(id)
    this.id = id
    this.cache = state.cache
    this.state = state
    this.emit = emit
    this.isLoading = false
  }

  update (header, center, cooperative, actions) {
    if (this.page !== this.state.page) return true
    if (this.inEdit !== this.state.inEdit) return true
    if (this.isLoading !== this.state.consumptions.isLoading) return true
    if (!moment(center).isSame(this.center)) return true
    if (cooperative._id !== this.cooperative) return true
    if (actions.length !== this.actions.length) return true
    return actions.reduce((shouldUpdate, action, index) => {
      return shouldUpdate || action._id === this.actions[index]
    }, false)
  }

  createElement (header, center, cooperative, actions) {
    this.center = center
    this.page = this.state.chart.page
    this.cooperative = cooperative._id
    this.inEdit = this.state.chart.inEdit
    this.actions = actions.map(action => action._id)

    if (typeof window === 'undefined') {
      return empty(html`
        <div>
          <div class="Chart-loading u-hiddenNoScript">${__('Fetching data')}</div>
          <div class="u-hiddenHasScript">
            ${__('There would be a pretty chart here, had you enabled JavaScript')}
          </div>
        </div>
      `)
    }

    const { page, inEdit } = this.state.chart
    const { granularity, items, normalized, type, compare } = this.state.consumptions

    /**
     * Figure out where (when) to center the graph
     */

    const now = moment(center).add(5, granularity)
    const offset = Math.ceil(now.diff(Date.now(), granularity, true))
    if (offset > 0) now.subtract(offset, granularity)
    now.add(page, granularity)

    /**
     * Lookup cached data
     */

    const series = []
    const queries = getQueries(now, cooperative, this.state).reduce((missing, query) => {
      const cached = items[hash(query)]

      if (cached) {
        series.push({ name: query.name, values: cached })
        return missing
      }

      return missing.concat([query])
    }, [])

    /**
     * Fetch any data that might be missing and render loading state
     */

    this.isLoading = false
    if (queries.length && !this.state.error) {
      this.isLoading = true
      this.emit('consumptions:fetch', queries)
    }

    /**
     * Compose Monthly values into years
     */

    if (granularity === 'year') {
      series.forEach(set => { set.values = composeYears(set.values) })
    }

    /**
     * Find the shortest series set
     */

    const max = series.reduce((max, set) => {
      return !max || (set.values.length < max) ? set.values.length : max
    }, 0)

    /**
     * Ensure all series sets are the same length
     */

    series.forEach(set => { set.values = set.values.slice(0, max) })

    const hasLater = moment(now).isBefore(Date.now(), granularity)
    const period = getPeriod(granularity, now)
    const expected = moment(period.to).diff(period.from, granularity)
    const hasEarlier = series.length && (series[0].values.length >= expected)

    return html`
      <div class="${className('Chart', { 'is-loading': this.isLoading })}">
        <div class="Chart-header">
          <div class="Chart-title">
            ${header()}
          </div>
          <div class="Chart-filter">
            <!-- Toggle form/summary view -->
            ${inEdit ? this.cache(ChartFilter, this.id + '-chart-form').render(cooperative) : html`
              <div class="Chart-summary">
                <button class="Button Button--round Button--inverse u-marginLs u-floatRight" onclick=${() => this.emit('chart:edit')}>
                  ${__('Edit')}
                </button>

                <!-- Compiled summary of current filter settings -->
                <strong>${__('Showing')}: </strong>
                ${__('Energy use').toLowerCase() + ' '}
                <em>${normalized ? ` (${__('normalized')})` : ''}</em>
                ${__('for') + ' '}
                <em>${getType(cooperative, type).toLowerCase() + ' '}</em>
                ${__('per') + ' '}
                <em>${__(granularity) + ' '}</em>
                ${compare ? html`
                  <span>
                    ${__('compared with') + ' '}
                    <em>${compare === 'prev_year'
                      ? __('Previous year').toLowerCase()
                      : this.state.cooperatives.find(item => item._id === compare).name
                    }</em>
                  </span>
                ` : null}
              </div>
            `}
          </div>
        </div>
        <div class="Chart-graph">
          <span class="Chart-legend">
            ${getType(cooperative, type)} (kWh/m<sup>2</sup>)
          </span>

          <!-- Cached container element -->
          ${this.cache(Highchart, this.id + '-highchart').render(granularity, formatActions(actions, series, granularity), series, this.isLoading)}

          <!-- Paginate buttons -->
          <button class="Chart-paginate Chart-paginate--left" onclick=${() => this.emit('chart:paginate', -1)} disabled=${!hasEarlier}>
            ${chevron('left')} <span class="Chart-pageLabel">${__('Show earlier')}</span>
          </button>
          <button class="Chart-paginate Chart-paginate--right" onclick=${() => this.emit('chart:paginate', 1)} disabled=${!hasLater}>
            <span class="u-floatRight">
              <span class="Chart-pageLabel">${__('Show more recent')}</span> ${chevron('right')}
            </span>
          </button>
        </div>
      </div>
    `

    /**
     * Simple no fuzz loading state
     */

    function empty (content) {
      return html`
        <div class="Chart">
          <div class="Chart-header">
            <div class="Chart-title">
              ${header()}
            </div>
          </div>
          <div class="Chart-graph u-flex u-flexJustifyCenter u-flexAlignItemsCenter u-paddingVl">
            ${content}
          </div>
        </div>
      `
    }
  }
}

/**
 * Format type depending on whether consumption includes households' electricity
 */

function getType (cooperative, type) {
  const { incHouseholdElectricity } = cooperative
  const addSuffix = type === 'electricity' && incHouseholdElectricity
  return addSuffix ? __('Total elec (incl. households)') : __(type)
}

/**
 * Compile queries for fetching consumption data
 */

function getQueries (now, cooperative, state) {
  const { granularity, type, compare, normalized } = state.consumptions

  const queries = []
  queries.push(Object.assign({
    name: compare === 'prev_year' ? __('Current year') : cooperative.name,
    types: [ type ],
    normalized: normalized,
    cooperative: cooperative._id
  }, getPeriod(granularity, now)))

  if (granularity === 'month' && compare === 'prev_year') {
    const from = moment(queries[0].from).subtract(1, 'month')
    const period = getPeriod(granularity, from)

    queries.push(Object.assign({
      name: __('Previous year'),
      types: [ type ],
      normalized: normalized,
      cooperative: cooperative._id
    }, period))
  }

  if (SELECTED_COOPERATIVE.test(compare)) {
    const id = compare.match(SELECTED_COOPERATIVE)[1]
    const other = state.cooperatives.find(item => item._id === id)
    let name = other.name
    const performances = {
      primary: getPerformance(cooperative),
      other: getPerformance(other)
    }

    // Ensure that primary serie is labeled by name and not 'Current year'
    queries[0].name = cooperative.name

    if (type === 'electricity') {
      if (performances.other) {
        if (performances.other.incHouseholdElectricity) {
          name = __('%s (incl. households)', name)
        } else if (performances.other.isGuesstimate) {
          name = __('%s (estimate)', name)
        }
      }

      if (performances.primary) {
        if (performances.primary.incHouseholdElectricity) {
          queries[0].name = __('%s (incl. households)', queries[0].name)
        } else if (performances.primary.isGuesstimate) {
          queries[0].name = __('%s (estimate)', queries[0].name)
        }
      }
    }

    // Have other cooperative inherit period from primary serie
    queries.push(Object.assign({}, queries[0], {
      cooperative: id,
      name: name
    }))
  }

  return queries
}

/**
 * Compile actions for data set period
 */

function formatActions (actions, series, granularity) {
  if (!series.length || !series[0].values.length) { return [] }

  const points = []
  const values = series[0].values

  actions.forEach((action, index) => {
    // Filter out only those who are within the given time span
    const min = moment(values[0].date).startOf(granularity)
    const max = moment(values[values.length - 1].date).endOf(granularity)

    if (!moment(action.date).isBetween(min, max)) {
      return
    }

    // Find closest data point to latch on to
    const date = moment(action.date)
    const point = values.find(point => date.isSame(point.date, granularity))

    if (action.merge) {
      // Actions may merge with an associated series point, let's do that
      point.hasAction = true
    } else {
      // Or they'll be added to a seperate serie
      points.push({
        name: index + 1,
        date: action.date,
        value: point.value
      })
    }
  })

  return points
}

/**
 * Calculate yearly consumption by summing up months
 */

function composeYears (data) {
  return data.reduce((years, point) => {
    // Get last year in list
    const year = years[years.length - 1]

    if (year && (year.date.getFullYear() === point.date.getFullYear())) {
      year.value += point.value
    } else {
      years.push({
        date: moment(point.date).startOf('year').toDate(),
        value: point.value
      })
    }

    return years
  }, [])
}

/**
 * Calculate from and to based on granularity
 */

function getPeriod (granularity, now = Date.now()) {
  switch (granularity) {
    case 'month': return {
      from: moment(now).subtract(11, 'months').startOf('month').toDate(),
      to: moment(now).endOf('month').toDate()
    }
    case 'year': return {
      from: moment(now).subtract(11, 'years').startOf('year').toDate(),
      to: moment(now).subtract(1, 'year').endOf('year').toDate()
    }
    default: throw (new Error(`Granularity "${granularity}" not supported`))
  }
}
