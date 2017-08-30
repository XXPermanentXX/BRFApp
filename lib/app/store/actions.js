const INIT = { credentials: 'include', headers: { accept: 'application/json' }};

module.exports = function actions(initialState) {
  return (state, emitter) => {
    state.actions = (initialState || []);

    emitter.on('actions:add', data => {
      if (Array.isArray(data)) {
        state.actions.push(...data);
      } else {
        state.actions.push(data);
      }

      emitter.emit('render');
    });

    emitter.on('actions:fetch', id => {
      if (Array.isArray(id)) {
        Promise.all(id.map(fetchAction)).then(results => {
          emitter.emit('actions:add', results);
        }, err => emitter.emit('error', err));
      } else {
        fetchAction(id).then(result => {
          emitter.emit('actions:add', result);
        }, err => emitter.emit('error', err));
      }
    });
  };

  /**
   * Fetch action by id
   * @param  {String} id Unique id for action to fetch
   * @return {Promise}   Resolves to actions data
   */

  function fetchAction(id) {
    return fetch(`/actions/${ id }`, INIT).then(body => body.json());
  }
};
