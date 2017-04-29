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

const id = exports.id = function () {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
};

/**
 * Capitalize first letter of string
 * @param  {String} str String that is to be captialized
 * @return {String}
 */

exports.capitalize = function capitalize(str) {
  return str[0].toUpperCase() + str.substr(1);
};

/**
 * Prevent function beeing called more than every `delay`
 * @param  {Function} fn          Function to call
 * @param  {Number}   [delay=200] How long to wait
 * @return {Function}             Debounced function
 */

exports.debounce = function debounce(fn, delay = 200) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => { fn.apply(this, args); }, delay);
  };
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
 * Cache an element for performance sake.
 * Takes either a function or an object with a render and optional update method
 * and diffing algorithm.
 *
 * @example
 * cache(user => html`<a href="/users/${ user._id }`>${ user.name }</a>`)
 *
 * @example
 * let map;
 * cache({
 *   shouldUpdate(args, prev) {
 *     return args[0].lng !== prev[0].lng || args[0].lat !== prev[0].lat;
 *   },
 *   update(coordinates, emit) {
 *     map.setCenter([coordinates.lng, coordinates.lat]);
 *   },
 *   render(coordinates, emit) {
 *     return html`<div onload=${ el => {
 *       map = new mapboxgl.Map({
 *         container: el,
 *         center: [coordinates.lng, coordinates.lat],
 *       });
 *     } />`;
 *   }
 * })
 *
 * @param  {Mixed}    props Function or Object
 * @return {Function}       Cached render function
 */

exports.cache = function cache(props) {
  let _args, _render, element;
  const uid = `cache_${ id() }`;
  const isSameNode = target => target.id === uid;

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props.render === 'function') {
    _render = props.render;
  } else {
    throw (new Error('Cache must be provided with a render function'));
  }

  const shouldUpdate = props.shouldUpdate || ((args, prev) => {
    if (args.length !== prev.length) {
      return true;
    }

    return args.reduce((diff, arg, index) => {
      return diff || arg !== prev[index];
    }, false);
  });

  return function render(...args) {
    if (!element) {
      element = _render(...args);
      element.id = uid;
      element.isSameNode = isSameNode;
    } else if (shouldUpdate(args, _args || [])) {
      if (props.update) {
        props.update(element, ...args);
      } else {
        element = _render(...args);
        element.id = uid;
        element.isSameNode = isSameNode;
      }
    }

    _args = args;

    return element;
  };
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
      const script = html`<script src="/${ source }.js" async></script>`;
      script.onerror = reject;
      script.onload = () => {
        script.parentNode.removeChild(script);
        resolve(require(source));
      };
      document.head.appendChild(script);
    }
  });
};

/**
 * Get viewport width
 */

exports.vw = function vw() {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
};

/**
 * Get viewport height
 */

exports.vh = function vh() {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
};
