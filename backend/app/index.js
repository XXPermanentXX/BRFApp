const choo = require('choo');
const { setLocale } = require('../locale');
const user = require('./models/user');
const menu = require('./models/menu');
const actions = require('./models/actions');
const cooperatives = require('./models/cooperatives');
const consumptions = require('./models/consumptions');

const INITIAL_STATE = {
  lang: 'sv',
  err: null,
  user: {},
  cooperatives: { items: [] },
  actions: { items: [] },
  consumptions: { items: [] }
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
  [ '/', require('../views/landing') ],
  [ '/auth', require('../views/auth') ],
  [ '/user', require('../views/user') ],
  [ '/how-it-works', require('../views/faq') ],
  [ '/about-the-project', require('../views/about') ],
  [ '/cooperatives', require('../views/map'), [
    [ '/:cooperative', require('../views/cooperative'), [
      [ '/consumption', require('../views/consumption') ]
    ]],
  ]],
  [ '/actions', require('../views/actions'), [
    [ '/:action', require('../views/action'), [
      [ '/edit', require('../views/edit-action') ]
    ]]
  ]],
  [ '/404', require('../views/error') ],
  [ '/error', require('../views/error') ]
];

app.model({
  reducers: {},
  state: {
    lang: INITIAL_STATE.lang,
    err: INITIAL_STATE.err,
  }
});

app.model(menu());
app.model(user(INITIAL_STATE.user));
app.model(actions(INITIAL_STATE.actions));
app.model(cooperatives(INITIAL_STATE.cooperatives));
app.model(consumptions(INITIAL_STATE.consumptions));

app.router({ default: '/404' }, [
  ...routes.map(localize('sv')),
  ...routes.map(prefix('en')).map(localize('en'))
]);

/**
 * Start application when running in browser
 */

if (typeof window !== 'undefined' && !window.location.hash) {
  /**
   * Remove server rendered static content
   */

  const static = document.querySelector('.js-static');
  if (static) {
    static.parentElement.removeChild(static);
  }

   /**
   * Initialize application
   */

  const tree = app.start();
  document.body.insertBefore(tree, document.body.firstChild);
}

/**
 * Creates and iterator that prifixes all given routes with language pathname
 * @param  {String} lang Language code
 * @return {Function}    Iterator for prefixing routes
 */

function prefix(lang) {
  const prefix = lang === 'sv' ? '' : `/${ lang }`;

  return ([ route, ...args ]) => [
    `${ prefix }${ route }`.replace(/\/$/, ''),
    ...args
  ];
}

/**
 * Create an iterator that handles localization before rendering view
 * @param  {String}   lang Language code
 * @return {Function}      Iterator that localizes routes
 */

function localize(lang) {
  return walk;

  function walk([ route, view, branches ]) {
    return [ route, wrap(view), branches && branches.map(walk) ];
  }

  function wrap(view) {
    return (state, prev, send) => {
      if (state.user._id) {
        setLocale(state.user.profile.language);
      } else {
        setLocale(lang);
      }

      return view(state, prev, send);
    };
  }
}
