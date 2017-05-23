const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const browserify = require('browserify');
const StreamCache = require('stream-cache');
const watchify = require('watchify-middleware');
const chokidar = require('chokidar');

const ROOT = path.resolve(__dirname, '..');
const bundler = browserify('app/index.js', {
  basedir: ROOT,
  debug: true,
  transform: [
    require('localenvify')
  ]
});
const jsmiddleware = watchify(bundler);

const cssBundler = postcss([
  require('postcss-import')(),
  require('postcss-custom-media')(),
  require('postcss-custom-properties')(),
  require('autoprefixer')()
]);

let deferred = processCSS();
const watcher = chokidar.watch('**/*.css', { cwd: ROOT, ignoreInitial: true });
watcher.on('all', () => { deferred = processCSS(); });

function processCSS() {
  return new Promise((resolve, reject) => {
    const file = path.resolve(ROOT, 'app/index.css');
    fs.readFile(file, (err, css) => {
      if (err) { return reject(err); }
      cssBundler.process(css, { from: file, to: file }).then(resolve, reject);
    });
  });
}

function cssmiddleware(req, res) {
  deferred.then(result => {
    res.set('Content-Type', 'text/css');
    res.send(result.css);
  }, err => res.status(500).send(err));
}

const cache = {};
module.exports = function (req, res, next) {
  if (req.url === '/index.js') {
    jsmiddleware(req, res);
  } else if (req.url === '/index.css') {
    cssmiddleware(req, res);
  } else if (/\.js$/.test(req.url)) {
    if (!cache[req.url]) {
      cache[req.url] = new StreamCache();
      browserify({
        basedir: ROOT,
        noParse: [
          require.resolve('highcharts'),
          require.resolve('mapbox-gl')
        ]
      })
        .require(req.url.replace(/^\//, '').replace(/\.js$/, ''))
        .bundle()
        .pipe(cache[req.url])
        .pipe(res);
    } else {
      cache[req.url].pipe(res);
    }
  } else {
    next();
  }
};
