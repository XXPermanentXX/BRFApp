const url = require('url');
const moment = require('moment');
const hash = require('object-hash');

const FORMAT = 'YYYYMM';

module.exports = function consumtions(initialState) {
  return (state, emitter) => {
    state.consumptions = Object.assign({
      items: {},
      type: 'electricity',
      compare: 'prev_year',
      granularity: 'month'
    }, initialState);

    emitter.on('consumptions:type', type => {
      state.consumptions.type = type;
      emitter.emit('render');
    });

    emitter.on('consumptions:granularity', granularity => {
      state.consumptions.granularity = granularity;
      emitter.emit('render');
    });

    emitter.on('consumptions:add', data => {
      if (Array.isArray(data)) {
        data.forEach(({ values, options }) => {
          state.consumptions.items[hash(options)] = values;
        });
      } else {
        state.consumptions.items[hash(data.options)] = data.values;
      }

      emitter.emit('render');
    });

    emitter.on('consumptions:fetch', options => {
      if (Array.isArray(options)) {
        Promise.all(options.map(options => {
          return fetchConsumtion(defaults(options)).then(values => ({ values, options }));
        })).then(
          results => emitter.emit('consumptions:add', results),
          err => emitter.emit('error', err)
        );
      } else {
        fetchConsumtion(defaults(options)).then(values => {
          emitter.emit('consumptions:add', { values, options });
        }, err => emitter.emit('error', err));
      }
    });

    function defaults(options) {
      return Object.assign({
        type: state.type,
        granularity: 'month'
      }, options);
    }
  };
};

/**
 * Fetch consumtion for given cooperative with query parameterss granularity,
 * from and to
 * @param  {Object} options Hash with cooperative and query parameters
 * @return {Promise}        Resolves to parsed response
 */

function fetchConsumtion(options) {
  const { from, to, type, granularity, cooperative: id } = options;

  return fetch(
    url.format({
      pathname: `/cooperatives/${ id }/consumption`,
      query: {
        type: type,
        granularity: granularity,
        from: moment(from).format(FORMAT),
        to: moment(to).format(FORMAT)
      }
    }),
    { headers: { accept: 'application/json' }}
  )
  .then(body => body.json().then(body => {
    const values = body
      // Index values by date
      .map((value, index) => {
        const date = moment(from, FORMAT).add(index, granularity + 's').toDate();
        return { value, date };
      })
      // Remove any empty values (i.e. current month)
      .filter(item => !!item.value);

    return values;
  }));
}
