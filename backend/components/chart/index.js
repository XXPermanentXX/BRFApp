const html = require('choo/html');
const moment = require('moment');
const highcharts = require('highcharts');
const { loader } = require('../icons');
const { __ } = require('../../locale');

const DATE_FORMAT = 'YYYYMM';
const IS_BROWSER = typeof window !== 'undefined';

module.exports = function (cooperative, state, send) {
  const consumptions = state.consumptions.items.find(props => {
    return props.cooperative === cooperative._id;
  });

  const query = {
    granularity: 'month',
    from: moment().subtract(1, 'year').format(DATE_FORMAT),
    to: moment().format(DATE_FORMAT)
  };

  if (!consumptions) {
    if (IS_BROWSER) {
      send('consumptions:fetch', Object.assign({ cooperative }, query));
    }

    return loading();
  }

  const values = Object.keys(consumptions.values);
  if (!values.includes(JSON.stringify(query))) {
    if (IS_BROWSER) {
      send('consumptions:fetch', Object.assign({ cooperative }, query));
    }

    return loading();
  }

  return html`
    <div class="Graph">
      ${ legend() }
    </div>
  `;
};

function loading() {
  return html`
    <div class="Graph">
      ${ legend() }
      ${ loader() }
    </div>
  `;
}

function legend() {
  return html`
    <div class="Graph-legend">
      ${ __('Energy use') }   (kWh/m<sup>2</sup>)
    </div>
  `;
}
