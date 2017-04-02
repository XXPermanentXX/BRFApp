const REQ_VALUE = 70;
exports.getEnergyClass = function getEnergyClass(performance) {
  if (performance <= REQ_VALUE * 0.5) {
    return 'A';
  } else if(performance > REQ_VALUE * 0.5 && performance <= REQ_VALUE * 0.75) {
    return 'B';
  } else if(performance > REQ_VALUE * 0.75 && performance <= REQ_VALUE * 1.0) {
    return 'C';
  } else if(performance > REQ_VALUE * 1.0 && performance <= REQ_VALUE * 1.35) {
    return 'D';
  } else if(performance > REQ_VALUE * 1.35 && performance <= REQ_VALUE * 1.8) {
    return 'E';
  } else if(performance > REQ_VALUE * 1.8 && performance <= REQ_VALUE * 2.35) {
    return 'F';
  } else if(performance > REQ_VALUE * 2.35) {
    return 'G';
  }
};

const DECIMAL_SIGN = (0.5 + '').match(/0(.{1})5/)[1];
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

exports.cache = function cache(props) {
  let _args, _render, element;
  const uid = `cache_${ id() }`;
  const isSameNode = target => target.id === uid;

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props === 'object') {
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
        props.update(args);
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
