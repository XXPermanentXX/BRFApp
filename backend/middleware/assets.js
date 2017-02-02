const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const browserify = require('browserify');
const watchify = require('watchify-middleware');

const ROOT = path.resolve(__dirname, '..');

const bundler = browserify('index.js', {
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

function cssmiddleware(req, res) {
  const file = path.resolve(ROOT, req.url.replace(/^\//, ''));
  fs.readFile(file, (err, css) => {
    cssBundler.process(css, { from: file, to: file }).then(result => {
      res.set('Content-Type', 'text/css');
      res.send(result.css);
    });
  });
}

module.exports = function (req, res, next) {
  switch (path.extname(req.url)) {
    case '.js': return jsmiddleware(req, res);
    case '.css': return cssmiddleware(req, res);
    default: next();
  }
};
