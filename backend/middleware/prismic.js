const Prismic = require('prismic.io');
const resolve = require('../resolve');

module.exports = function () {
  return (req, res, next) => {
    Prismic.api(process.env.PRISMIC_API).then(api => {
      req.prismic = { api, linkResolver };
      next();
    }, next);
  };
};

function linkResolver(doc) {
  return resolve(doc.slug || '/');
}
