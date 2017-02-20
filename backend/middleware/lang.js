const url = require('url');

module.exports = function (lang) {
  return (req, res, next) => {

    /**
     * Attach language to response locals
     */

    res.locals.lang = req.user ? req.user.profile.language || 'sv' : lang;

    /**
     * Add a resolve method to the response object that localizes urls
     */

    const prefix = res.locals.lang === 'sv' ? '' : `/${ lang }`;
    const resolve = res.resolve = function (...args) {
      const props = url.parse(args.length > 1 ? url.resolve(...args) : args[0]);

      props.pathname = prefix + props.pathname;

      return url.format(props);
    };

    /**
     * Overwrite the native `redirect` with a method that also resolves language
     */

    const origRedirect = res.redirect;
    res.redirect = pathname => origRedirect.call(res, resolve(pathname));

    next();
  };
};
