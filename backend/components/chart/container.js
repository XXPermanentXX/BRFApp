const html = require('choo/html');
const widget = require('cache-element/widget');
const merge = require('lodash.merge');
const moment = require('moment');
const Highcharts = require('highcharts');
const defaults = require('./defaults');
const { capitalize, format } = require('../utils');
const { __ } = require('../../locale');

module.exports = function createContainer() {
  let chart;

  const cached = widget({
    onupdate(el, actions, data) {
      chart.update({ series: compose(actions, data) });
    },
    render(actions, data) {
      function onunload() {
        chart.destroy();
      }

      function onload(el) {
        chart = Highcharts.chart(el, merge({
          legend: {
            title: {

              /**
               * Localization needs to be defined on render to adhere to locale
               */

              text: `${ __('Energy use') } (kWh/m<sup>2</sup>)`
            }
          },
          tooltip: {

            /**
             * Position tooltip relative to chart width
             */

            positioner(width, height, point) {
              // Align to right when there's no room
              if ((width + point.plotX) > chart.plotWidth) {
                // Apply right align modifier as soon as the element is in the DOM
                requestAnimationFrame(() => {
                  const tooltip = el.querySelector('.js-tooltip');
                  tooltip.classList.add('Chart-tooltip--alignRight');
                });

                return { x: point.plotX - width + 25, y: point.plotY - 14 };
              }

              return { x: point.plotX - 2, y: point.plotY - 15 };
            },

            /**
             * Shared tooltips throw off the `positioner`, so we include all
             * series points for given index in main serie's tooltip
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
        }, defaults, {
          series: compose(actions, data)
        }), chart => chart.reflow());
      }

      return html`<div onload=${ onload } onunload=${ onunload } />`;
    }
  });

/**
 * Compose Highcharts formated series from list of actions and datasets
 * @param  {Array} actions List of actions
 * @param  {Array} data    List of datasets
 * @return {Array}         Highcharts compatible series data
 */

  function compose(actions, data) {
    const extremes = [];
    const series = data.map(set => {
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
        pointStart: (new Date(set.values[0].date)).getTime(),
        pointInterval: moment(set.values[1].date).diff(set.values[0].date),
        data: set.values.map((props, index) => {
          // Determine whether this point in an extreme
          const isExtreme = (high === props.value || low === props.value);

          // Lookup possible conflict in list of extremes
          const conflict = extremes.find(extreme => index === extreme.index);

          return {
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
        })
      };
    });

    series.push({
      data: actions.map(action => ({
        name: action.name,
        x: (new Date(action.date)).getTime(),
        y: action.value
      }))
    });

    return series;
  }

  return cached;
};
