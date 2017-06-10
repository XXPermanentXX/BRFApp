const html = require('choo/html');
const merge = require('lodash.merge');
const capitalize = require('lodash.capitalize');
const moment = require('moment');
const { loader } = require('../icons');
const defaults = require('./defaults');
const { __ } = require('../../locale');
const { format, className, resource, vw } = require('../utils');
const component = require('../utils/component');

module.exports = component({
  name: 'chart',
  cache: true,
  isInitialized: false,

  shouldUpdate(args, prev) {
    const [granularity, actions, data] = args;
    const [prevGranularity, prevActions, prevData] = prev;

    // Compare granularity
    if (granularity !== prevGranularity) {
      return true;
    }

    // Compare number of actions
    if (actions.length !== prevActions.length) {
      return true;
    }

    // Compare number of data series
    if (data.length !== prevData.length) {
      return true;
    }

    // Compare data series
    return data.reduce((result, serie, serieIndex) => {
      return result || serie.values.reduce((diff, value, index) => {
        return diff || value !== prevData[serieIndex].values[index];
      }, false);
    }, false);
  },

  update(element, granularity, actions, data) {
    if (this.chart) {
      this.chart.update(getConfig(granularity, actions, data));
    }
  },

  onload(element, granularity, actions, data) {
    // Exit early if Highcharts has been initialized already
    if (this.isInitialized) {
      return;
    } else {
      this.isInitialized = true;
    }

    resource('highcharts').then(Highcharts => {
      // Remove loader from chart container
      element.innerHTML = '';

      const config = merge({
        tooltip: {
          // Position tooltip relative to chart width
          positioner(width, height, point) {
            const offset = vw() >= 800 ? 12 : 0;

            // Align to right when there's no room
            if ((width + point.plotX) > this.chart.plotWidth) {
              // Apply right align modifier as soon as the element is in the DOM
              requestAnimationFrame(() => {
                const tooltip = element.querySelector('.js-tooltip');
                tooltip.classList.add('Chart-tooltip--alignRight');
              });

              return { x: point.plotX - width + 25 + offset, y: point.plotY - 14 };
            }

            return { x: point.plotX - 2 + offset, y: point.plotY - 15 };
          }
        }
      }, defaults, getConfig(granularity, actions, data));

      this.chart = Highcharts.chart(element, config, chart => chart.reflow());
    });
  },

  render() {
    return html`
      <div>
        <!-- Insert intermediary loader while waiting for Highcharts -->
        <div class="u-textCenter u-paddingVl">
          ${ loader() }
        </div>
      </div>
    `;
  }
});

/**
 * Create Highcharts options based on data
 * @param  {String} granularity Chart granularity setting
 * @param  {Array}  actions     List of actions
 * @param  {Array}  data        List of data series
 * @return {Object}             Highcharts compatible options
 */

function getConfig(granularity, actions, data) {
  return {
    series: compose(actions, data),
    tooltip: {
      formatter: formatters[granularity]
    },
    xAxis: {
      labels: {
        formatter: labels[granularity]
      }
    }
  };
}


/**
 * Adapt xAxis labels to granularity
 */

const labels = {
  month() {
    return moment(this.value).format('MMM YYYY');
  },
  year() {
    return moment(this.value).format('YYYY');
  }
};

/**
 * Shared tooltips throw off the `positioner`, so we include all
 * series points for given index in main serie's tooltip
 */

const formatters = {
  month() {
    // Get point index and a list of all series
    const { point: { index, hasAction }, series: { chart: { series }} } = this;
    const sets = series.slice(0, 2).filter(serie => serie.visible && serie.data.length);

    // Figure out if the two series are aligned to pick a proper title
    const leadYear = series[0].data[0].name.getFullYear();
    const trailYear = series.length > 1 && series[1].data[0].name.getFullYear();
    const isAligned = leadYear === trailYear;

    return `
      <span class="${ className('Chart-tooltip js-tooltip', { 'Chart-tooltip--hasAction': hasAction }) }">
        <strong>${ capitalize(moment(this.x).format('MMMM')) }</strong>
        ${ sets.reduce((str, serie) => `
          ${ str }
          <br />
          <strong>${ isAligned ? serie.name : moment(serie.data[index].name).format('YYYY') }</strong> ${ format(serie.data[index].y) } kWh/m<sup>2</sup>
        `, '') }
      </span>
    `;
  },
  year() {
    // Get point index and a list of all series
    const { point: { index, hasAction }, series: { chart: { series }} } = this;
    const sets = series.slice(0, 2).filter(serie => serie.visible && serie.data.length);

    return `
      <span class="${ className('Chart-tooltip js-tooltip', { 'Chart-tooltip--hasAction': hasAction }) }">
        <strong>${ capitalize(moment(this.x).format('YYYY')) }</strong>
        ${ sets.reduce((str, serie) => `
          ${ str }
          <br />
          <strong>${ serie.name }</strong> ${ format(serie.data[index].y) } kWh/m<sup>2</sup>
        `, '') }
      </span>
    `;
  }
};

/**
 * Compose Highcharts formated series from list of actions and datasets
 * @param  {Array} actions List of actions
 * @param  {Array} data    List of datasets
 * @return {Array}         Highcharts compatible series data
 */

function compose(actions, data) {
  const extremes = [];
  const series = data.filter(set => set.values.length).map(set => {
    let highIndex, lowIndex;

    /**
    * Find lowest value in the dataset and store it and it's index
    */

    const low = set.values.reduce((low, props, index) => {
      if (props.value > low) { return low; }
      lowIndex = index;
      return props.value;
    });

    /**
    * Find highest value in the dataset and store it and it's index
    */

    const high = set.values.reduce((high, props, index) => {
      if (props.value < high) { return high; }
      highIndex = index;
      return props.value;
    });

    /**
    * Store extremes so that we can lookup collision in next iteration
    */

    extremes.push(
      { index: lowIndex, value: low },
      { index: highIndex, value: high }
    );

    return {
      name: set.name,
      showInLegend: true,
      pointStart: (new Date(set.values[0].date)).getTime(),
      pointInterval: moment(set.values[1].date).diff(set.values[0].date),
      data: set.values.map((props, index) => {
        // Determine whether this point in an extreme
        const isExtreme = (high === props.value || low === props.value);

        // Lookup possible conflict in list of extremes
        const conflict = extremes.find(extreme => index === extreme.index);

        const point = {
          dataLabels: {
            enabled: isExtreme,
            // Adjust label position so as not to overlap with other labels
            y: (conflict && (conflict.value < props.value)) ? -7 : 6,
            verticalAlign: (conflict && (conflict.value < props.value)) ? 'bottom' : 'top'
          },
          // Set the actual date as name
          name: props.date,
          // All series align to main serie xAxis
          x: (new Date(data[0].values[index].date)).getTime(),
          y: props.value
        };

        if (props.hasAction) {
          point.hasAction = true;
          point.marker = {
            fillColor: '#FEC73D',
            lineColor: '#FEC73D',
            radius: 5
          };
        }

        return point;
      })
    };
  });

  /**
   * Populate comparative series with empty data if no data was provided
   */

  if (series.length === 1) {
    series.push({ showInLegend: false, data: [] });
  }

  /**
   * Add on actions to list of series
   */

  series.push({
    data: actions.map(action => ({
      name: action.name,
      x: (new Date(action.date)).getTime(),
      y: action.value
    }))
  });

  return series;
}
