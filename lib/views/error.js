const app = require('../components/app');
const { __ } = require('../locale');
const views = {
  '404': require('../components/app/404'),
  '500': require('../components/app/500')
};

module.exports = function view(state, emit) {
  return app(error, title)(state, emit);

  function error(state, emit) {
    if (state.error.status in views) {
      return views[state.error.status](state.error);
    } else {
      return views['500'](state.error);
    }
  }

  function title() {
    switch (state.error.status) {
      case 404: return __('Page not found');
      default: return __('An error has occured');
    }
  }
};

