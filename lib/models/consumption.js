const url = require('url');
const request = require('request');

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
    .map(meter => meter.meterId)
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
