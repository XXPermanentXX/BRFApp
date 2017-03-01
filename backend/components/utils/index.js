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
exports.format = function (src) {
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

exports.capitalize = function (str) {
  return str[0].toUpperCase() + str.substr(1);
};
