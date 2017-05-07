const { getLocale } = require('./locale');

module.exports = function (route) {
  return localize(route);
};

function localize(route) {
  route = route.slug ? `/${ route.slug }` : route;

  const locale = getLocale();

  // FIXME: Should not prefix when logged in
  return locale === 'sv' ? route : `/${ locale }${ route }`;
}
