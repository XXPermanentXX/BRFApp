const choo = require('choo');
const { setLocale } = require('../locale');

const DEFAULT_LANGUAGE = 'sv';
const INITIAL_STATE = {};

/**
 * Read initial state from DOM
 */

if (typeof document !== 'undefined') {
  const src = document.querySelector('.js-initialState');
  Object.assign(INITIAL_STATE, JSON.parse(src.innerText));
}

/**
 * Create the application instance
 */

const app = module.exports = choo();

/**
 * Take a list of routes/view pairs (`[<path>, <view>]`) and wrap each
 * respective view with a function that also sets the `document.title` on render
 * derrived from `view.title(state)`
 * @type {Array}
 */

const routes = [
  ['/', require('../views/map')],
  ['/cooperatives', require('../views/map')],
  ['/auth', require('../views/auth')],
  ['/user', require('../views/user')],
  ['/how-it-works', require('../views/faq')],
  ['/about-the-project', require('../views/about')],
  ['/cooperatives/:cooperative', require('../views/cooperative')],
  ['/actions', require('../views/actions')],
  ['/actions/:action', require('../views/action')],
  ['/actions/edit', require('../views/edit-action')],
  ['/404', require('../views/error')],
  ['/error', require('../views/error')],
].map(titleize);

/**
 * Localize all the routes with a lang prefix
 */

routes.map(localize('sv')).forEach(([route, view]) => app.route(route, view));
routes.map(localize('en')).forEach(([route, view]) => app.route(route, view));

/**
 * Set upp app models
 */

app.use(require('./models/menu')());
app.use(require('./models/geoip')());
app.use(require('./models/chart')());
app.use(require('./models/cms')({
  faq: INITIAL_STATE.faq,
  about: INITIAL_STATE.about,
  footer: INITIAL_STATE.footer,
  onboarding: INITIAL_STATE.onboarding
}));
app.use(require('./models/error')(INITIAL_STATE.error));
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
   * Mount the application
   */

  app.mount('.App');
}

/**
 * Set document title derrived from `view.title(state)` on render
 * @param  {String} route   View route
 * @param  {Function} _view View function optionally decorated with `title`
 * @return {Array}          Identical route/view pair wit wrapped view
 */

function titleize([route, _view]) {
  if (typeof document === 'undefined') { return [route, _view]; }

  function view(state, emit) {
    const title = _view.title ? _view.title(state) : '';
    document.title = `${ title && title + ' | ' }BRF Energi`;
    return _view(state, emit);
  }

  return [route, view];
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
