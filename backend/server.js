// Load environement variables before anything else
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const compression = require('compression');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const pages = require('./pages');
const routes = require('./routes');
const lang = require('./middleware/lang');
const auth = require('./middleware/auth');
const locale = require('./locale');
const app = require('./index');

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/youpower');

const db = mongoose.connection;
const server = express();

server.set('civis_opt', {
  host: 'civisprod.cloud.reply.eu',
  path: '/CivisEnergy/InterfaceWP3.svc/'
});

/**
 * Extend Express native render method with a custom framework compatible one
 */

server.render = function (route, options, done) {
  const state = Object.assign({}, this.locals, options._locals, options);
  const cache = this.enabled('view cache');

  let output;

  locale.setLocale(state.lang);

  if (cache) {
    this.cache[state.lang] = this.cache[state.lang] || {};
    output = this.cache[state.lang][route];
  }

  if (!output) {
    try {
      // Determine page wrapper for view
      const page = route === '/' ? pages.landing : pages.app;

      // Wrap app `toString` method with route for injection into page
      const view = (...args) => app.toString(route, ...args);

      // Inject view in page
      output = page(view, state, state, () => {});
    } catch (err) {
      return done(err);
    }
  }

  if (cache) {
    this.cache[state.lang][route] = output;
  }

  done(null, output);
};

/**
 * Extend native response render method with a type switch and user decoration
 */

server.use(require('./middleware/render'));

/**
 * Enable CORS
 */

server.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  next();
});

if (process.env.NODE_ENV === 'development') {
  server.use(require('./middleware/assets'));
}

server.use(compression());
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.raw());
server.use(session({
  secret: process.env.BRFENERGI_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
server.use(expressValidator());
server.use(auth.initialize());
server.use(auth.session());
server.use(lang('sv'), routes);
server.use('/en', lang('en'), routes);
server.use(express.static('public'));

// eslint-disable-next-line no-console
db.on('error', err => console.error(err));
db.once('open', function() {
  const listener = server.listen(process.env.PORT || 0, () => {
    const { address: host, port } = listener.address();

    // eslint-disable-next-line no-console
    console.info(`
      Server listening at ${ host.replace('::', 'localhost') }:${ port }
    `);
  });
});
