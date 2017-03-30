module.exports = function menu() {
  return (state, emitter) => {
    state.isMenuOpen = false;

    emitter.on('menu:open', () => {
      state.isMenuOpen = true;
      emitter.emit('render');
    });

    emitter.on('menu:close', () => {
      state.isMenuOpen = false;
      emitter.emit('render');
    });

    emitter.on('menu:toggle', () => {
      state.isMenuOpen = !state.isMenuOpen;
      emitter.emit('render');
    });
  };
};
