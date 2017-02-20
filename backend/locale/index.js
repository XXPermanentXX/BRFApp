const Y18N = require('y18n');
const lang = {
  sv: require('./sv'),
  en: require('./en')
};

const options = { directory: __dirname };

/**
 * Custom extension of y18n
 * @param {Object} options Options for i18n
 */

const My18N = function (options) {
  return Y18N.call(this, options);
};

My18N.prototype = Object.create(Y18N.prototype);

/**
 * Adaption for browser bundle
 */

if (typeof window !== 'undefined') {
  options.updateFiles = false;
  options.locale = process.env.BRFENERGI_LANG;

  /**
   * Extend y18n with custom (static) `_readLocaleFile`
   */

  My18N.prototype._readLocaleFile = function () {
    this.cache[this.locale] = lang[this.locale];
  };
}

module.exports = new My18N(options);
