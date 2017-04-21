module.exports = function cooperatives(initialState, auth) {
  return (state, emitter) => {
    state.cooperatives = initialState || [];

    emitter.on('cooperatives:add', data => {
      if (Array.isArray(data)) {
        data.forEach(inject);
      } else {
        inject(data);
      }

      emitter.emit('render');
    });

    emitter.on('cooperatives:fetch', id => {
      const url = id ? `/cooperatives/${ id }` : '/cooperatives';
      const headers = { accept: 'application/json' };

      if (auth) {
        headers.Authorization = auth;
      }

      fetch(url, { headers }).then(body => body.json().then(data => {
        emitter.emit('cooperatives:add', data);
      }), err => emitter.emit('error', err));
    });

    function inject(props) {
      const items = state.cooperatives;
      const index = items.findIndex(item => item._id === props._id);

      if (index !== -1) {
        items.splice(index, 1, Object.assign({}, items[index], props));
      } else {
        items.push(props);
      }
    }
  };
};
