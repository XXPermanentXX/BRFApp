module.exports = function cooperatives(state) {
  return {
    namespace: 'cooperatives',
    state: Object.assign({
      items: [],
    }, state),
    reducers: {
      add(state, data) {
        const items = [ ...state.items ];

        if (Array.isArray(data)) {
          data.forEach(inject);
        } else {
          inject(data);
        }

        function inject(props) {
          const index = items.findIndex(item => item._id === props._id);

          if (index !== -1) {
            items.splice(index, 1, Object.assign({}, items[index], props));
          } else {
            items.push(props);
          }
        }

        return Object.assign({}, state, { items });
      }
    },
    effects: {
      fetch(state, id, send, done) {
        const url = id ? `/cooperatives/${ id }` : '/cooperatives';

        fetch(url, { headers: { accept: 'application/json' }})
          .then(body => body.json())
          .then(body => send('cooperatives:add', body, (err, value) => {
            if (err) { return done(err); }
            done(null, value);
          }), done);
      }
    }
  };
};
