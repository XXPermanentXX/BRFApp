module.exports = function actions(state = {}) {
  return {
    namespace: 'actions',
    reducers: {
      add(state, data) {
        const items = state.items.splice();

        if (Array.isArray(data)) {
          items.push(...data);
        } else {
          items.push(data);
        }

        return Object.assign({}, state, { items });
      }
    },
    effects: {
      fetch(state, options, send, done) {
        if (Array.isArray(options)) {
          Promise.all(options.map(fetchAction)).then(results => {
            send('actions:add', results, done);
          }, done);
        } else {
          fetchAction(options).then(result => {
            send('actions:add', result, done);
          }, done);
        }
      }
    },
    state: Object.assign({
      items: []
    }, state)
  };
};

/**
 * Fetch action by id
 * @param  {String} id Unique id for action to fetch
 * @return {Promise}   Resolves to actions data
 */

function fetchAction(id) {
  return fetch(
    `/actions/${ id }`,
    { headers: { accept: 'application/json' }}
  )
  .then(body => body.json());
}
