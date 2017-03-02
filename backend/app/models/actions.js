module.exports = function (state = {}) {
  return {
    namespace: 'actions',
    reducers: {
      edit: (state, id) => Object.assign({}, state, { isEditing: id }),
      cancel: state => Object.assign({}, state, { isEditing: null })
    },
    state: state
  };
};
