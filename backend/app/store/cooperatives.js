const INIT = { credentials: 'include', headers: { accept: 'application/json' }};

module.exports = function cooperatives(initialState) {
  return (state, emitter) => {
    state.cooperatives = initialState || [];

    emitter.on('DOMContentLoaded', () => {
      emitter.emit('cooperatives:fetch');
    });

    emitter.on('cooperatives:add', ({ data }) => {
      const options = Object.assign({
        body: JSON.stringify(data),
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, INIT);

      fetch('/cooperatives', options)
        .then(body => body.json())
        .then(body => {
          state.cooperatives.push(body);
          state.isLoading = false;
          emitter.emit('pushState', `/cooperatives/${ body._id }`);
        });

      state.isLoading = true;
      emitter.emit('render');
    });

    emitter.on('cooperatives:update', ({ cooperative, data }) => {
      const options = Object.assign({
        body: JSON.stringify(data),
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }, INIT);

      fetch(`/cooperatives/${ cooperative._id }`, options)
        .then(body => body.json())
        .then(body => {
          const index = state.cooperatives.findIndex(item => {
            return item._id === cooperative._id;
          });

          state.cooperatives.splice(index, 1, body);
          state.isLoading = false;

          emitter.emit('pushState', `/cooperatives/${ body._id }`);
        });

      state.isLoading = true;
      emitter.emit('render');
    });

    emitter.on('cooperatives:fetch', id => {
      const url = id ? `/cooperatives/${ id }` : '/cooperatives';

      fetch(url, INIT).then(body => body.json().then(data => {
        if (Array.isArray(data)) {
          data.forEach(inject);
        } else {
          inject(data);
        }

        emitter.emit('render');
      }), err => emitter.emit('error', err));
    });

    function inject(props) {
      const items = state.cooperatives;
      const index = items.findIndex(item => item._id === props._id);

      if (index !== -1) {
        Object.assign(items[index], props);
      } else {
        items.push(props);
      }
    }
  };
};
