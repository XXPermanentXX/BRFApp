const html = require('choo/html');
const moment = require('moment');
const merge = require('lodash.merge');
const Highcharts = require('highcharts');
const { loader } = require('../icons');
const defaults = require('./defaults');

/**
 * Have a IIFE create a singular instance if highcharts that is used for all
 * charts throughout the application to spare excessive DOM constructors
 * @return {Function}        Chart render funcion
 */

const container = (function createContainer() {
  let chart, initial;
  const div = html`<div onload=${ onload } onunload=${ onunload } />`;

  function onunload() {
    chart.destroy();
  }

  function onload() {
    chart = Highcharts.chart(div, merge({
      tooltip: {

        /**
         * Contextually define positioner as it needs access to the chart
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
        }
      }
    }, defaults, initial));
  }

  /**
   * Update chart in place
   * @param  {Object} data Chart data series
   * @return {Element}     Highcharts container
   */

  return data => {
    const high = data.values.reduce(findHigh);
    const low = data.values.reduce(findLow);

    const props = {
      xAxis: {
        categories: data.values.map(props => props.date)
      },
      series: [{
        name: data.name,
        data: data.values.map(props => ({
          dataLabels: {
            // Disable labels for all points that are not extremes
            enabled: !(high !== props.value && low !== props.value)
          },
          y: props.value
        }))
      }]
    };

    /**
     * If the chart isn't inialized yet, store properties for initialization
     */

    if (!chart) {
      initial = props;
    } else {
      chart.update(props);
    }

    return div;
  };
}());

module.exports = function chart(cooperative, state, prev, send) {
  const consumptions = state.consumptions.items.find(props => {
    return props.cooperative === cooperative._id;
  });

  /**
   * Construct query object that also works as cache key
   */

  const query = {
    granularity: 'month',
    from: moment().subtract(1, 'year').startOf('month').toDate(),
    to: moment().endOf('month').toDate()
  };

  const onload = () => send(
    'consumptions:fetch',
    Object.assign({ cooperative }, query)
  );

  if (!consumptions && !state.consumptions.isLoading) {
    return loading(onload);
  }

  const values = consumptions.values[JSON.stringify(query)];
  if (!values) {
    return loading(onload);
  }

  return html`
    <div class="Chart">
      ${ container({ name: cooperative.name, values }) }
    </div>
  `;
};

function findHigh(high, props) {
  return props.value < high ? high : props.value;
}

function findLow(low, props) {
  return props.value > low ? low : props.value;
}

function loading(onload) {
  return html`
    <div class="Chart" onload=${ onload }>
      ${ loader() }
    </div>
  `;
}
