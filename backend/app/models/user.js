const INIT = { credentials: 'include', headers: { accept: 'application/json' }};

module.exports = function user(initialState) {
  return (state, emitter) => {
    state.user = initialState || {};

    emitter.on('user:boarded', () => {
      if (state.user.isAuthenticated) {
        fetch('/user', Object.assign({
          method: 'patch',
          body: { hasBoarded: true }
        }, INIT)).then(body => body.json()).then(user => {
          state.user = user;
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
