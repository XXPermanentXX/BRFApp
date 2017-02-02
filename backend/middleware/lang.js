module.exports = function (lang) {
  return (req, res, next) => {
    res.locals.lang = lang;
    next();
  };
};
