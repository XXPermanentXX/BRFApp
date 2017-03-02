require('hotswap');

const orig = require.extensions['.js'];

require.extensions['.js'] = function (m, filename) {
  if (/backend\/(views|components|pages|app)/.test(filename)) {
    const _compile = m._compile;

    m._compile = function (content, filename) {
      content += ';module.change_code = 1;';
      return _compile.call(this, content, filename);
    };
  }

  orig(m, filename);
};
