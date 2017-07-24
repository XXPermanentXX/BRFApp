const geoip = require('./geoip');
const chart = require('./chart');
const cms = require('./cms');
const error = require('./error');
const user = require('./user');
const actions = require('./actions');
const cooperatives = require('./cooperatives');
const consumptions = require('./consumptions');

module.exports = function (initialState) {
  return function (state, emitter) {
    emitter.on('pushState', onnavigate);
    emitter.on('replaceState', onnavigate);

    /**
     * Initialize all state models with their respective initial state
     */

    [
      geoip(),
      chart(),
      cms([
        'faq', 'about', 'footer', 'onboarding', 'registration', 'sign-in'
      ].reduce((docs, key) => {
        // Pluck out CMS content as key/value pairs
        docs[key] = initialState[key];
        return docs;
      }, {})),
      error(initialState.error),
      user(initialState.user),
      actions(initialState.actions),
      cooperatives(initialState.cooperatives),
      consumptions(initialState.consumptions)
    ].forEach(model => model(state, emitter));

    function onnavigate() {
      // Scroll to top on navigate
      document.body.scrollIntoView(true);

      // Store window location in state
      state.location = window.location.href.match(/^https?:\/(.+)/)[1];
    }
  };
};
