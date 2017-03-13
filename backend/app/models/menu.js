module.exports = function menu(state) {
  return {
    namespace: 'menu',
    reducers: {
      open: state => Object.assign({}, state, { isOpen: true }),
      close: state => Object.assign({}, state, { isOpen: false }),
      toggle: state => Object.assign({}, state, { isOpen: !state.isOpen })
    },
    state: state || {
      open: false
    }
  };
};
