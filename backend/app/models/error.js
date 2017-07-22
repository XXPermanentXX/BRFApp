module.exports = function error(initialState) {
  return (state, emitter) => {
    state.error = initialState || null;

    emitter.on('error', err => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(err.stack);
      }

      state.error = err.message || err;

      emitter.emit('render');
    });

    emitter.on('error:dismiss', () => {
      state.error = null;
      emitter.emit('render');
    });
  };
};
