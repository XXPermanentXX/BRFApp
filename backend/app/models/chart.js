const { debounce, vw } = require('../../components/utils');

module.exports = function error() {
  let hasChanged = false;
  const cache = {};

  return (state, emitter) => {
    state.chart = {
      isReady: false,
      inEdit: false,
      page: 0
    };

    emitter.on('DOMContentLoaded', () => {
      state.chart.inEdit = vw() >= 800;
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', debounce(() => {
        if (hasChanged) { return; }

        const inEdit = vw() >= 800;
        if (state.chart.inEdit !== inEdit) {
          state.chart.inEdit = inEdit;
          emitter.emit('render');
        }
      }, 250));
    }

    emitter.on('cooperatives:fetch', id => {
      if (!id) {
        state.chart.isReady = true;
        emitter.emit('render');
      }
    });

    emitter.on('pushState', path => {
      hasChanged = false;
      cache[window.location.href] = { page: state.chart.page };
      Object.assign(state.chart, {
        page: 0,
        inEdit: vw() >= 800
      }, cache[path]);
    });

    emitter.on('chart:edit', () => {
      hasChanged = true;
      state.chart.inEdit = true;
      emitter.emit('render');
    });

    emitter.on('chart:paginate', diff => {
      state.chart.page += diff;
      emitter.emit('render');
    });
  };
};
