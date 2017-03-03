const choo = require('choo');
const { setLocale } = require('./locale');

const app = module.exports = choo();
const routes = [
  [ '/', require('./views/landing') ],
  [ '/auth', require('./views/auth') ],
  [ '/user', require('./views/user') ],
  [ '/how-it-works', require('./views/faq') ],
  [ '/about-the-project', require('./views/about') ],
  [ '/cooperatives', require('./views/map'), [
    [ '/:cooperative', require('./views/cooperative'), [
      [ '/consumption', require('./views/consumption') ]
    ]],
  ]],
  [ '/actions', require('./views/actions'), [
    [ '/:action', require('./views/action') ]
  ]],
  [ '/404', require('./views/error') ],
  [ '/error', require('./views/error') ]
];

app.model({
  reducers: {},
  state: {
    lang: 'sv',
    cooperatives: [],
    actions: []
  }
});

app.router({ default: '/404' }, [
  ...routes.map(localize('sv')),
  ...routes.map(prefix('en')).map(localize('en'))
]);

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
      if (state.user) {
        setLocale(state.user.profile.language);
      } else {
        setLocale(lang);
      }

      return view(state, prev, send);
    };
  }
}
