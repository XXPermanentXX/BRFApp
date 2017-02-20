const { getLocale } = require('./locale');

module.exports = function (route) {
  return localize(route);
};

function localize(route) {
  const locale = getLocale();
  return locale === 'sv' ? route : `/${ locale }${ route }`;
}
