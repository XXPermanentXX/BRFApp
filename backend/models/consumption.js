const url = require('url');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const request = require('request');
const async = require('async');
const _ = require('underscore');

const meterIDs = {};

readMeterIDs();

const getRawEnergimolnetConsumption = async.memoize(
  (meters, type, granularity, from, to, done) => {
    const ids = meters.filter(meter => meter.type === type && meter.useInCalc);

    async.map(ids, (meter, callback) => {
      return getConsumptionFromAPI(meter.meterId, granularity, from, to, callback);
    }, (err, results) => {
      if (err) { return done(err); }
      done(null, _.unzip(results).map(data => data.reduce((a, b) => a + b, 0)));
    });
  },
  uniqueApiCallHash
);

exports.getEnergimolnetConsumption = function (options, done) {
  const { meters, types, granularity, from, to, normalized } = options;
  let endpoint = [
    url.resolve(process.env.METRY_ENDPOINT_URL, 'consumptions'),
    'sum',
    granularity,
    from + (to ? `-${ to }` : '')
  ].join('/');

  endpoint += `?metric=${ normalized ? 'energy_norm' : 'energy' }`;
  endpoint += `&meters=${ meters
    .filter(meter => types.includes(meter.type))
    .map(meter => meterIDs[meter.meterId] || meter.meterId)
    .filter(Boolean).join(',')
  }`;

  request({ url: endpoint, json: true }, (error, response, body) => {
    if (!error) {
      if (body.code === 200) {
        done(null, body.data[0].periods[0].energy);
      } else {
        done(new Error(body.message));
      }
    } else {
      done(error);
    }
  });
};

function getConsumptionFromAPI(meterId, granularity, from, to, done) {
  request({
    url: [
      url.resolve(process.env.METRY_ENDPOINT_URL, 'consumptions'),
      meterIDs[meterId],
      granularity,
      from + (to ? `-${ to }` : '')
    ].join('/')
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var result = JSON.parse(body).data[0].periods[0].energy;
      done(null, result);
    } else {
      done(error);
    }
  });
}

function uniqueApiCallHash(meters, type, granularity, from, to) {
  const result = meters
    .filter(meter => meter.type === type && meter.useInCalc)
    .map(meter => meter.meterId )
    .reduce((memo, value) => memo + '-' + value, '');

  return [ result, type, granularity, from, to ].join('-');
}

/**
 * Load meter data from a temporary file where we map the meter with the BRF.
 * Later on this mapping should come in via a metry API
 */

function readMeterIDs() {
  const file = fs.createReadStream(
    path.join(__dirname, 'kth_open_data_channel_meter_mapping.csv')
  );

  readline.createInterface({
    terminal: false,
    input: file
  }).on('line', function (line) {
    if (!line) { return; }

    const ln = line.split(',');

    if (ln[0] == 'open') { return; }

    meterIDs[ln[1]] = ln[0];
  });
}
