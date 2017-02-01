// Load environement variables before anything else
require('dotenv').config();

const os = require('os');
const path = require('path');
const winston = require('winston');
const which = require('which');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const mongoose = require('mongoose');
const mkdirp = require('mkdirp');
const dedent = require('dedent');
const routes = require('./routes');
const auth = require('./middleware/auth');
const app = require('./app');

const logger = winston.loggers.get('default');

const PORT = process.env.PORT || 3000;
const HOME = os.homedir();

winston.loggers.add('default', {
  console: {
    level: 'silly',
    colorize: true
  }
});

if (process.env.NODE_ENV === 'test') {
  logger.warn(dedent`
    ========================= NOTICE ==========================
    running in test mode, this should NOT be used in production
    ===========================================================
  `);
}

// verify that graphicsmagick is installed
try {
  which.sync('gm');
} catch (e) {
  // eslint-disable-next-line no-console
  console.log(`
		${e}

		ERROR: could not find graphicsmagick binary!
		Please install graphicsmagick, for example on Ubuntu:
		$ sudo apt-get install graphicsmagick
	`);
  process.exit();
}

// make sure directories exist for picture uploads
mkdirp(path.join(HOME, '.youpower', 'actionCommentPictures'));
mkdirp(path.join(HOME, '.youpower', 'actionPictures'));
mkdirp(path.join(HOME, '.youpower', 'profilePictures'));
mkdirp(path.join(HOME, '.youpower', 'communityPictures'));

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

  let view;

  if (cache) {
    this.cache[state.lang] = this.cache[state.lang] || {};
    view = this.cache[state.lang][route];
  }

  if (!view) {
    try {
      view = dedent`
        <!DOCTYPE html>
        ${ app.toString(route, state) }
      `;
    } catch (err) {
      return done(err);
    }
  }

  if (cache) {
    this.cache[state.lang][route] = view;
  }

  done(null, view);
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
server.use(routes);
server.use('/en',
  (req, res, next) => {
    res.locals.lang = 'en';
    next();
  },
  routes
);

db.on('error', logger.error.bind(console, 'connection error:'));
db.once('open', function() {
  logger.info('connected to database');
  server.listen(PORT, function() {
    logger.info('express listening on PORT', PORT);
  });
});
