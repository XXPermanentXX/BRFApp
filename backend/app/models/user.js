module.exports = function user(initialState) {
  return (state, emitter) => {
    state.user = initialState || {};
  };
};
