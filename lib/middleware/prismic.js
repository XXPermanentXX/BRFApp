const Prismic = require('prismic.io');
const resolve = require('../resolve');

module.exports = function () {
  return (req, res, next) => {
    res.locals.content = res.locals.content || {};
    Prismic.api(process.env.PRISMIC_API).then(api => {
      req.prismic = { api, linkResolver };
      next();
    }, next);
  };
};

function linkResolver(doc) {
  return resolve(doc.slug || '/');
}
