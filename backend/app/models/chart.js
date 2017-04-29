const { debounce, vw } = require('../../components/utils');

module.exports = function error() {
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
        if (vw() >= 800) {
          state.chart.inEdit = true;
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
      cache[location.pathname] = { page: state.chart.page };
      Object.assign(state.chart, {
        page: 0,
        inEdit: vw() >= 800
      }, cache[path]);
    });

    emitter.on('chart:edit', () => {
      state.chart.inEdit = true;
      emitter.emit('render');
    });

    emitter.on('chart:paginate', diff => {
      state.chart.page += diff;
      emitter.emit('render');
    });
  };
};
