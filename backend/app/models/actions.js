module.exports = function actions(state = {}) {
  return {
    namespace: 'actions',
    reducers: {
    },
    state: Object.assign({
      items: [],
    }, state)
  };
};
