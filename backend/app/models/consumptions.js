const url = require('url');
const moment = require('moment');
const hash = require('object-hash');

const FORMAT = 'YYYYMM';

module.exports = function consumtions(initialState, auth) {
  return (state, emitter) => {
    state.consumptions = Object.assign({
      items: {},
      isLoading: false,
      type: 'electricity',
      compare: 'prev_year',
      granularity: 'month',
      normalize: true
    }, initialState);

    emitter.on('consumptions:type', type => {
      state.consumptions.type = type;
      emitter.emit('render');
    });

    emitter.on('consumptions:compare', compare => {
      state.consumptions.compare = compare;
      emitter.emit('render');
    });

    emitter.on('consumptions:normalize', normalize => {
      state.consumptions.normalize = normalize;
      emitter.emit('render');
    });

    emitter.on('consumptions:granularity', granularity => {
      const { consumptions: { compare }} = state;

      if (granularity === 'year' && compare === 'prev_year') {
        state.consumptions.compare = null;
      } else if (granularity === 'month' && compare === null) {
        state.consumptions.compare = 'prev_year';
      }

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
      const { consumptions } = state;
      const done = () => { consumptions.isLoading = false; };

      consumptions.isLoading = true;

      if (Array.isArray(options)) {
        Promise.all(options.map(options => {
          return fetchConsumtion(defaults(options)).then(values => ({ values, options }));
        })).then(
          results => emitter.emit('consumptions:add', results),
          err => emitter.emit('error', err)
        ).then(done);
      } else {
        fetchConsumtion(defaults(options)).then(
          values => emitter.emit('consumptions:add', { values, options }),
          err => emitter.emit('error', err)
        ).then(done);
      }
    });

    function defaults(options) {
      return Object.assign({
        types: [ state.consumptions.type ],
        granularity: 'month',
        normalize: state.consumptions.normalize
      }, options);
    }
  };

  /**
   * Fetch consumtion for given cooperative with query parameterss granularity,
   * from and to
   * @param  {Object} options Hash with cooperative and query parameters
   * @return {Promise}        Resolves to parsed response
   */

  function fetchConsumtion(options) {
    const { from, to, types, granularity, normalize, cooperative: id } = options;
    const headers = { accept: 'application/json' };

    if (auth) {
      headers.Authorization = auth;
    }

    return fetch(
      url.format({
        pathname: `/cooperatives/${ id }/consumption`,
        query: {
          types: types.join(','),
          normalize: normalize,
          granularity: granularity,
          from: moment(from).format(FORMAT),
          to: moment(to).format(FORMAT)
        }
      }),
      { headers }
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
};
