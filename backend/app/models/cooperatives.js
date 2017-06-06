module.exports = function cooperatives(initialState, auth) {
  return (state, emitter) => {
    state.cooperatives = initialState || [];

    emitter.on('DOMContentLoaded', () => {
      emitter.emit('cooperatives:fetch');
    });

    emitter.on('cooperatives:add', ({ data }) => {
      const options = {
        body: JSON.stringify(data),
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

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
      const options = {
        body: JSON.stringify(data),
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

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
      const headers = { accept: 'application/json' };

      if (auth) {
        headers.Authorization = auth;
      }

      fetch(url, { headers }).then(body => body.json().then(data => {
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
        items.splice(index, 1, Object.assign({}, items[index], props));
      } else {
        items.push(props);
      }
    }
  };
};
