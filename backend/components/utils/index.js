const html = require('choo/html');
const moment = require('moment');

const PERFORMANCE_FORMAT = 'YYYYMM';
const REQ_VALUE = 70;
const DECIMAL_SIGN = (0.5 + '').match(/0(.{1})5/)[1];

/**
 * Calculate energy class based on cooperative performance
 * @param  {Number} performance Performance (a-temp)
 * @return {String}             Grade from A-G or `null`
 */

exports.getEnergyClass = function getEnergyClass(performance) {
  if (performance <= REQ_VALUE * 0.5) {
    return 'A';
  } else if (performance > REQ_VALUE * 0.5 && performance <= REQ_VALUE * 0.75) {
    return 'B';
  } else if (performance > REQ_VALUE * 0.75 && performance <= REQ_VALUE * 1.0) {
    return 'C';
  } else if (performance > REQ_VALUE * 1.0 && performance <= REQ_VALUE * 1.35) {
    return 'D';
  } else if (performance > REQ_VALUE * 1.35 && performance <= REQ_VALUE * 1.8) {
    return 'E';
  } else if (performance > REQ_VALUE * 1.8 && performance <= REQ_VALUE * 2.35) {
    return 'F';
  } else if (performance > REQ_VALUE * 2.35) {
    return 'G';
  }

  return null;
};

/**
 * Find most recent performance entry for cooperative
 * @param  {Object} cooperative Cooperative model
 * @return {Number}             Value of most recent entry
 */

exports.getPerformance = function getPerformance(cooperative) {
  const byDate = cooperative.performances.slice().sort((a, b) => {
    const dateA = moment(`${ a.year }${ a.month }`, PERFORMANCE_FORMAT);
    const dateB = moment(`${ b.year }${ b.month }`, PERFORMANCE_FORMAT);
    return dateA.isAfter(dateB) ? -1 : 1;
  });

  return byDate.length ? byDate[0].value : undefined;
};

/**
 * Format number with localized decimal sign, spaced by thousands and no more
 * than two decimals
 * @param  {Number} src Number to be formated
 * @return {String}     Formated string
 */

exports.format = function format(src) {
  const factor = src > 1 ? 10 : 100;
  const [ whole, decimal ] = ((Math.round( src * factor ) / factor) + '').split(/,|\./);
  const spaced = whole
    // Get individual numbers in reversed order
    .split('').reverse()
    // Inject a space before every third number
    .reduce((sum, num, index) => sum + (index % 3 === 0 ? ` ${ num }` : num), '')
    // Put it back together in order
    .split('').reverse().join('').trim();

  if (decimal) {
    return `${ spaced }${ DECIMAL_SIGN }${ decimal }`;
  }

  return spaced;
};

/**
 * Generate a random 15 character long id
 * @return {String}
 */

exports.id = function id() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
};

/**
 * Compile class name based on booleans.
 * Takes either a default class and an object with switches or just the object
 *
 * @example
 * const classList = className('Foo', { 'Foo-bar': true, 'Foo-baz': false });
 * const classList = className({ 'is-open': true, 'in-transition': false });
 *
 * @param  {Mixed} args  String and Object or just Object
 * @return {String}      Space speerated list of class names
 */

exports.className = function className(...args) {
  const classList = typeof args[0] === 'string' ? args[0].split(' ') : [];
  const hash = typeof args[0] === 'object' ? args[0] : args[1] || {};

  Object.keys(hash).forEach(key => {
    if (hash[key]) {
      classList.push(key);
    }
  });

  return classList.join(' ');
};

/**
 * Load external resource
 * @param  {String}  source URI of resource
 * @return {Promise}        Resolves to resource module
 */

exports.resource = function resource(source) {
  return new Promise((resolve, reject) => {
    if (/\.css$/.test(source)) {
      document.head.insertBefore(
        html`<link rel="stylesheet" href=${ source } onload=${ resolve } />`,
        document.head.querySelector('link')
      );
    } else {
      const script = html`<script async></script>`;
      script.onerror = reject;
      script.onload = () => {
        script.parentNode.removeChild(script);
        resolve(require(source));
      };
      document.head.appendChild(script);
      script.src = `/${ source }.js`;
    }
  });
};

/**
 * Get viewport width
 * @return {Number}
 */

exports.vw = function vw() {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
};

/**
 * Get viewport height
 * @return {Number}
 */

exports.vh = function vh() {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
};
