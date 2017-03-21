const url = require('url');
const moment = require('moment');
const hash = require('object-hash');

const FORMAT = 'YYYYMM';

module.exports = function consumtions(state) {
  return {
    namespace: 'consumptions',
    state: Object.assign({
      items: [],
      type: 'electricity',
      compare: 'prev_year',
      granularity: 'month'
    }, state),
    reducers: {
      type: (state, type) => Object.assign({}, state, { type }),
      granularity: (state, granularity) => Object.assign({}, state, {
        granularity: granularity
      }),
      add(state, data) {
        const items = Object.assign({}, state.items);

        if (Array.isArray(data)) {
          data.forEach(({ values, options }) => {
            items[hash(options)] = values;
          });
        } else {
          items[hash(data.options)] = data.values;
        }

        return Object.assign({}, state, { items });
      }
    },
    effects: {
      fetch(state, options, send, done) {
        if (Array.isArray(options)) {
          Promise
            .all(options.map(options => {
              return fetchConsumtion(defaults(options)).then(values => ({ values, options }));
            }))
            .then(results => send('consumptions:add', results, done), done);
        } else {
          fetchConsumtion(defaults(options)).then(values => {
            send('consumptions:add', { values, options }, done);
          }, done);
        }

        function defaults(options) {
          return Object.assign({
            type: state.type,
            granularity: 'month'
          }, options);
        }
      }
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
