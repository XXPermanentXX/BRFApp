// Load environement variables before anything else
require('dotenv').config();

const os = require('os');
const path = require('path');
const winston = require('winston');
const which = require('which');
const express = require('express');
const bodyParser = require('body-parser');
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
  const state = Object.assign({}, this.locals, options._locals, options, {
    cache: this.enabled('view cache')
  });

  let view;

  if (state.cache) {
    view = this.cache[route];
  }

  if (!view) {
    try {
      view = app.toString('/', state);
      // view = dedent`
      //   <!DOCTYPE html>
      //   ${ app.toString(route, state) }
      // `;
    } catch (err) {
      return done(err);
    }
  }

  if (state.cache) {
    state.cache[name] = view;
  }

  done(null, view);
};

/**
 * Extend response native render method with a type switcher
 */

server.use(function (req, res, next) {
  const orig = res.render;

  res.render = function (route, state) {
    if (route && req.accepts('html')) {
      return orig.call(this, route, state);
    } else {
      return res.json(state);
    }
  };

  next();
});

/**
 * Enable CORS
 */

server.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  next();
});

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.raw());
server.use(expressValidator());
server.use(auth.initialize());
server.use('/en', (req, res, next) => { req.lang = 'en'; next(); }, routes);
server.use(routes);

db.on('error', logger.error.bind(console, 'connection error:'));
db.once('open', function() {
  logger.info('connected to database');
  server.listen(PORT, function() {
    logger.info('express listening on PORT', PORT);
  });
});
