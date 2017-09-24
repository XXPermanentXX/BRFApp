const html = require('choo/html');
const error = require('./error');
const header = require('../page-head');
const symbols = require('../icons/symbols');
const { className } = require('../utils');
const errors = {
  '404': require('./404'),
  '500': require('./500')
};

const DEFAULT_TITLE = 'Brf Energi';

module.exports = function createApp(view, title) {
  return function app(state, emit) {
    let content;
    let hasCrashed = state.error && state.error.status >= 500;

    if (state.error && state.error.status in errors) {
      title = errors[state.error.status].title;
      content = errors[state.error.status](state.error);
    } else {
      try {
        content = view(state, emit);
      } catch (err) {
        hasCrashed = true;
        title = errors['500'].title;
        content = errors['500'](err);
      }
    }

    emit(
      state.events.DOMTITLECHANGE,
      title ? `${ title(state) } | ${ DEFAULT_TITLE }` : DEFAULT_TITLE
    );

    return html`
      <body class="${ className('App', { 'js-app': typeof window === 'undefined' }) }">
        ${ !hasCrashed ? error(state, emit) : null }
        ${ !hasCrashed ? header(state, emit) : null }
        ${ content }
        ${ symbols() }
      </body>
    `;
  };
};
