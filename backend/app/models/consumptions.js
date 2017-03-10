const url = require('url');

module.exports = function (state) {
  return {
    namespace: 'consumptions',
    state: state,
    reducers: {
      add(state, { body, id, key }) {
        const items = state.items.slice();
        let item = items.find(item => item.cooperative === id);

        if (!item) {
          item = { cooperative: id, values: {} };
          items.push(item);
        }

        item.values[key] = body;

        return Object.assign({}, state, { items });
      }
    },
    effects: {
      fetch(state, options, send, done) {
        const id = options.cooperative._id;
        const { granularity, from, to } = options;
        const key = JSON.stringify({ granularity, from, to });

        fetch(
          url.format({
            pathname: `/cooperatives/${ id }/consumption`,
            query: { granularity, from, to }
          }),
          { headers: { accept: 'application/json' }}
        )
        .then(body => body.json())
        .then(body => send('consumptions:add', { body, id, key }, (err, value) => {
          if (err) { return done(err); }
          done(null, value);
        }), done);
      }
    }
  };
};
