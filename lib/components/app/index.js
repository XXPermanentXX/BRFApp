const html = require('choo/html');
const error = require('./error');
const crash = require('./500');
const footer = require('./footer');
const header = require('../page-head');
const symbols = require('../icons/symbols');
const { className } = require('../utils');
const { __ } = require('../../locale');

const DEFAULT_TITLE = 'Brf Energi';

module.exports = function createApp(view, title) {
  return function app(state, emit) {
    let content;
    let hasCrashed = state.error && state.error.status >= 500;

    if (hasCrashed) {
      content = crash(state.error);
    } else {
      try {
        content = view(state, emit);
      } catch (err) {
        hasCrashed = true;
        content = crash(err);
      }
    }

    if (hasCrashed) {
      emit(state.events.DOMTITLECHANGE, __('An error has occured'));
    } else {
      emit(
        state.events.DOMTITLECHANGE,
        title ? `${ title(state) } | ${ DEFAULT_TITLE }` : DEFAULT_TITLE
      );
    }

    return html`
      <body class="${ className('App', { 'js-app': typeof window === 'undefined' }) }">
        ${ !hasCrashed ? error(state, emit) : null }
        ${ !hasCrashed ? header(state, emit) : null }
        ${ content }
        ${ !hasCrashed ? footer(state, emit) : null }
        ${ symbols() }
      </body>
    `;
  };
};
