const html = require('choo/html');
const error = require('./error');
const footer = require('./footer');
const header = require('../page-head');
const symbols = require('../icons/symbols');
const { className } = require('../utils');

module.exports = function wrapper(view, title) {
  return function app(state, emit) {
    emit(state.events.DOMTITLECHANGE, title(state));

    return html`
      <body class="${ className('App', { 'js-app': typeof window === 'undefined' }) }">
        ${ error(state, emit) }
        ${ header(state, emit) }
        ${ view(state, emit) }
        ${ footer(state, emit) }
        ${ symbols() }
      </body>
    `;
  };
};
