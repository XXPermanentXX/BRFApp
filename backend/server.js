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
const method = require('./middleware/method');
const prismic = require('./middleware/prismic');
const app = require('./app');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URL);

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
      output = pages.app(view, state);
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

if (process.env.NODE_ENV === 'test') {
  server.use(auth.basic);
}

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
server.use(express.static(__dirname + '/public'));

// eslint-disable-next-line no-console
db.on('error', err => console.error(err));
db.once('open', function() {
  const listener = server.listen(process.env.PORT || 0, () => {
    const { address: host, port } = listener.address();

    // eslint-disable-next-line no-console
    console.info(`> Server listening at http://localhost:${ port }`);
  });
});
