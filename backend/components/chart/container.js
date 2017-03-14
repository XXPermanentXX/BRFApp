const html = require('choo/html');
const merge = require('lodash.merge');
const moment = require('moment');
const Highcharts = require('highcharts');
const defaults = require('./defaults');
const { capitalize, format } = require('../utils');

/**
 * Have a IIFE create a singular instance if highcharts that is used for all
 * charts throughout the application to spare excessive DOM constructors
 * @return {Function}        Chart render funcion
 */

module.exports = function createContainer() {
  let chart, initial;
  const div = html`<div onload=${ onload } onunload=${ onunload } />`;

  function onunload() {
    chart.destroy();
  }

  function onload() {
    chart = Highcharts.chart(div, merge({
      tooltip: {

        /**
         * Position tooltip relative to chart width
         */

        positioner(width, height, point) {
          // Align to right when there's no room
          if ((width + point.plotX) > chart.plotWidth) {
            // Apply right align modifier as soon as the element is in the DOM
            requestAnimationFrame(() => {
              const tooltip = div.querySelector('.js-tooltip');
              tooltip.classList.add('Chart-tooltip--alignRight');
            });

            return { x: point.plotX - width + 23, y: point.plotY - 4 };
          }

          return { x: point.plotX - 4, y: point.plotY - 4 };
        },

        /**
         * Shared tooltips throw off the `positioner` so we include all series
         * points for given index in main serie's tooltip
         */

        formatter() {
          // Get point index and a list of all series
          const { point: { index }, series: { chart: { series }} } = this;
          const sets = series.slice(0, 2).filter(serie => serie.visible);

          return `
            <span class="Chart-tooltip js-tooltip">
              <strong>${ capitalize(moment(this.x).format('MMMM')) }</strong>
              ${ sets.reduce((str, serie) => `
                ${ str }
                <br />
                <strong>${ moment(serie.data[index].name).format('YYYY') }</strong> ${ format(serie.data[index].y) } kWh/m<sup>2</sup>
              `, '') }
            </span>
          `;
        }
      }
    }, defaults, initial));
  }

  /**
   * Update chart in place
   * @param  {Object} data Chart data series
   * @return {Element}     Highcharts container
   */

  return (actions, data) => {
    const series = data.map(set => {
      const high = set.values.reduce(findHigh);
      const low = set.values.reduce(findLow);

      return {
        name: set.name,
        pointStart: (new Date(set.values[0].date)).getTime(),
        pointInterval: moment(set.values[1].date).diff(set.values[0].date),
        data: set.values.map((props, index) => ({
          dataLabels: {
            // Disable labels for all points that are not extremes
            enabled: !(high !== props.value && low !== props.value)
          },
          // Set the actual date as name
          name: props.date,
          // All series align to main serie xAxis
          x: (new Date(data[0].values[index].date)).getTime(),
          y: props.value
        }))
      };
    });

    series.push({
      data: actions.map(action => ({
        name: action.name,
        x: (new Date(action.date)).getTime(),
        y: action.value
      }))
    });

    /**
     * If the chart isn't inialized yet, store properties for initialization
     */

    if (!chart) {
      initial = { series };
    } else {
      series.forEach((serie, index) => chart.series[index].setData(serie));
    }

    return div;
  };
};

function findHigh(high, props) {
  return props.value < high ? high : props.value;
}

function findLow(low, props) {
  return props.value > low ? low : props.value;
}
