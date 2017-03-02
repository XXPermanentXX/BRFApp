module.exports = function (state) {
  return {
    namespace: 'cooperatives',
    state: state,
    reducers: {
      add(state, cooperative) {
        const items = [ ...state.items, cooperative ];
        return Object.assign({}, state, { items });
      }
    },
    effects: {
      fetch(state, id, send, done) {
        fetch(`/cooperatives/${ id }`, { headers: { accept: 'application/json' }})
          .then(body => body.json())
          .then(body => send('cooperatives:add', body, (err, value) => {
            if (err) { return done(err); }
            done(null, value);
          }), done);
      }
    }
  };
};
