const url = require('url');
const moment = require('moment');

const FORMAT = 'YYYYMM';

module.exports = function consumtions(state) {
  return {
    namespace: 'consumptions',
    state: Object.assign({
      items: [],
      isLoading: false
    }, state),
    reducers: {
      fetching: state => Object.assign({}, state, { isLoading: true }),
      add(state, { values, id, query }) {
        const items = state.items.slice();
        let item = items.find(item => item.cooperative === id);

        if (!item) {
          item = { cooperative: id, values: {} };
          items.push(item);
        }

        // Cache result by query used to fetch it
        item.values[query] = values;

        return Object.assign({}, state, { items, isLoading: false });
      }
    },
    effects: {
      fetch(state, options, send, done) {
        send('consumptions:fetching', null, err => {
          if (err) { return done(err); }

          if (Array.isArray(options)) {
            /**
             * Perform concurrent fetch if given array of options
             */

            Promise.all(options.map(doFetch)).then(results => {

              /**
               * Compose a recursive send queue that executes a send for each
               * result as a callback to the previous send
               */

              const queue = results.reduce((callback, result) => {
                return (err) => {
                  if (err) { return done(err); }
                  send('consumptions:add', result, callback);
                };
              }, done);

              /**
               * Start queue
               */

              queue();
            }, done);
          } else {
            doFetch(options).then(result => {
              send('consumptions:add', result, done);
            }, done);
          }
        });
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

function doFetch(options) {
  const id = options.cooperative._id;
  const { from, to, granularity = 'month' } = options;
  const query = JSON.stringify({ granularity, from, to });

  return fetch(
    url.format({
      pathname: `/cooperatives/${ id }/consumption`,
      query: {
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

    return { values, id, query };
  }));
}
