const geoip = require('./geoip');
const chart = require('./chart');
const content = require('./content');
const error = require('./error');
const user = require('./user');
const actions = require('./actions');
const cooperatives = require('./cooperatives');
const consumptions = require('./consumptions');

module.exports = function (initialState) {
  return function (state, emitter) {
    emitter.on(state.events.PUSHSTATE, onnavigate);
    emitter.on(state.events.REPLACESTATE, onnavigate);

    /**
     * Initialize all state models with their respective initial state
     */

    [
      geoip(),
      chart(),
      content(initialState.content),
      error(initialState.error),
      user(initialState.user),
      actions(initialState.actions),
      cooperatives(initialState.cooperatives),
      consumptions(initialState.consumptions)
    ].forEach(model => model(state, emitter));

    function onnavigate() {
      // Scroll to top on navigate
      if (!location.hash) {
        document.body.scrollIntoView(true);
      }
    }
  };
};
