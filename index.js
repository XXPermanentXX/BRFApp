const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const compression = require('compression');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const chalk = require('chalk');
const document = require('./lib/document');
const routes = require('./lib/routes');
const lang = require('./lib/middleware/lang');
const auth = require('./lib/middleware/auth');
const method = require('./lib/middleware/method');
const prismic = require('./lib/middleware/prismic');
const error = require('./lib/middleware/error');
const app = require('./lib/app');

const server = express();

/**
 * Extend Express native render method with a custom framework compatible one
 */

server.render = function (route, options, done) {
  let output;
  const state = Object.assign({}, this.locals, options._locals, options);
  const cache = this.enabled('view cache');

  // Remove any nested duplicates
  delete state._locals;

  if (cache) {
    this.cache[state.lang] = this.cache[state.lang] || {};
    output = this.cache[state.lang][route];
  }

  if (!output) {
    try {
      // Determine whether route needs to be prefixed with language pathname
      const prefix = state.lang === 'sv' ? '' : `/${ state.lang }`;

      // Join route with prefix to generate actual view path
      const pathname = `${ prefix }${ route }`.replace(/\/$/, '');

      // Wrap app `toString` method for injection into page
      const view = (...args) => app.toString(pathname, ...args);

      // Inject view in page and ensure that state is handled by `toJSON`
      output = document(view, state);
    } catch (err) {
      return done(err);
    }
  }

  if (cache) {
    this.cache[state.lang][route] = output;
  }

  done(null, output);
};

if (process.env.NODE_ENV === 'development') {
  server.use(require('./lib/middleware/assets'));
}

if (process.env.NODE_ENV === 'test') {
  server.use(auth.basic);
}

server.use(express.static('public', { maxage: 1000 * 60 * 60 * 24 * 365 }));
server.use(require('./lib/middleware/render'));
server.use(compression());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.raw());
server.use(method());
server.use(session({
  secret: process.env.BRFENERGI_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
server.use(expressValidator());
server.use(auth.initialize());
server.use(auth.session());
server.use(prismic());
server.use(lang('sv'), routes);
server.use('/en', lang('en'), routes);
server.use(error);


mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URL, { useMongoClient: true }).then(() => {
  server.listen(process.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.info('> ' + chalk.bold(`Server listening at ${ chalk.underline(`http://localhost:${ process.env.PORT }`) }`));
  });
}, err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
