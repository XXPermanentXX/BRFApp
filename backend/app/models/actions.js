module.exports = function actions(initialState, auth) {
  return (state, emitter) => {
    state.actions = (initialState || []).map(action => {
      return Object.assign({}, action,{ date: new Date(action.date) });
    });

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
    const headers = { accept: 'application/json' };

    if (auth) {
      headers.Authorization = auth;
    }

    return fetch(`/actions/${ id }`, { headers }).then(body => body.json());
  }
};
