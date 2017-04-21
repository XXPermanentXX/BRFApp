const choo = require('choo');
const { setLocale } = require('../locale');

const DEFAULT_LANGUAGE = 'sv';
const INITIAL_STATE = {
  err: null
};

/**
 * Read initial state from DOM
 */

if (typeof document !== 'undefined') {
  const src = document.querySelector('.js-initialState');
  Object.assign(INITIAL_STATE, JSON.parse(src.innerText));
}

const app = module.exports = choo({ history: true });
const routes = [
  ['/', require('../views/landing')],
  ['/auth', require('../views/auth')],
  ['/user', require('../views/user')],
  ['/how-it-works', require('../views/faq')],
  ['/about-the-project', require('../views/about')],
  ['/cooperatives', require('../views/map')],
  ['/cooperatives/:cooperative', require('../views/cooperative')],
  ['/cooperatives/consumption', require('../views/consumption')],
  ['/actions', require('../views/actions')],
  ['/actions/:action', require('../views/action')],
  ['/actions/edit', require('../views/edit-action')],
  ['/404', require('../views/error')],
  ['/error', require('../views/error')],
];

routes.map(localize('sv')).forEach(([route, view]) => app.route(route, view));
routes.map(localize('en')).forEach(([route, view]) => app.route(route, view));

app.use(require('./models/menu')());
app.use(require('./models/error')());
app.use(require('./models/geoip')());
app.use(require('./models/user')(INITIAL_STATE.user, INITIAL_STATE.auth));
app.use(require('./models/actions')(INITIAL_STATE.actions, INITIAL_STATE.auth));
app.use(require('./models/cooperatives')(INITIAL_STATE.cooperatives, INITIAL_STATE.auth));
app.use(require('./models/consumptions')(INITIAL_STATE.consumptions, INITIAL_STATE.auth));

/**
 * Start application when running in browser
 */

if (typeof window !== 'undefined') {
  /**
   * Remove url hash as choo includes them in routes
   */

  if (window.location.hash) {
    history.replaceState({}, document.title, window.location.pathname);
  }

   /**
   * Initialize application
   */

  app.mount('.js-app > :first-child');
}

/**
 * Create an iterator that handles localization before rendering view
 * @param  {String}   lang Language code
 * @return {Function}      Iterator that localizes routes
 */

function localize(lang) {
  return function ([route, view]) {
    const localized = lang === DEFAULT_LANGUAGE ? route : (lang + '/' + route);

    return [localized, (state, emit) => {
      try {
        setLocale(state.user.profile.language);
      } catch (err) {
        setLocale(lang);
      }

      return view(state, emit);
    }];
  };
}
