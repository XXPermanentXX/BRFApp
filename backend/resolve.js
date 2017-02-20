const { getLocale } = require('./locale');

module.exports = function (route) {
  return localize(route);
};

function localize(route) {
  const locale = getLocale();
  // FIXME: Should not prefix when logged in
  return locale === 'sv' ? route : `/${ locale }${ route }`;
}
