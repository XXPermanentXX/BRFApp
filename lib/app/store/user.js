const INIT = { credentials: 'include', headers: { accept: 'application/json' }};

module.exports = function user(initialState) {
  return (state, emitter) => {
    state.user = initialState || {};

    emitter.on('user:boarded', () => {
      if (state.user.isAuthenticated) {
        fetch(`/users/${ state.user._id }`, Object.assign({
          method: 'PUT',
          body: JSON.stringify({ hasBoarded: true })
        }, INIT, {
          headers: Object.assign({
            'Content-Type': 'application/json'
          }, INIT.headers)
        })).then(body => body.json()).then(user => {
          state.user = user;
          emitter.emit('render');
        }, err => {
          state.error = err.message;
          emitter.emit('render');
        });
      } else {
        state.user.hasBoarded = true;
        document.cookie = 'hasBoarded=true';
        emitter.emit('render');
      }
    });
  };
};
