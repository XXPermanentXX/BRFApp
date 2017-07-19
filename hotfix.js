/**
 * Jack into Node internal require mechanism to enable hot reloading of all
 * modules that match the `HOT_MODULES` pattern.
 */

const HOT_MODULES = /backend\/(views|components|pages|app)/;

require('hotswap');

const orig = require.extensions['.js'];

require.extensions['.js'] = function (m, filename) {
  if (HOT_MODULES.test(filename)) {
    const _compile = m._compile;

    m._compile = function (content, filename) {
      content += ';module.change_code = 1;';
      return _compile.call(this, content, filename);
    };
  }

  orig(m, filename);
};
