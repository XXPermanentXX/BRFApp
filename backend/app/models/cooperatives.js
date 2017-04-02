module.exports = function cooperatives(initialState) {
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

      fetch(url, { headers: { accept: 'application/json' }})
        .then(body => body.json().then(data => {
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
