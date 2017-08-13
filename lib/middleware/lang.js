const url = require('url');

module.exports = function (lang) {
  return (req, res, next) => {
    const origRedirect = res.redirect;

    /**
     * Have user defined language have precedence over Swedish (default)
     */

    if (req.user) {
      res.locals.lang = req.user.profile.language;
    } else {
      res.locals.lang = lang;
      res.redirect = redirect;
      res.resolve = resolve;
    }

    next();

    /**
     * Resolve urls per defined language
     */

    function resolve(...args) {
      const prefix = lang === 'sv' ? '' : `/${ lang }`;
      const props = url.parse(args.length > 1 ? url.resolve(...args) : args[0]);

      props.pathname = prefix + props.pathname;

      return url.format(props);
    }

    /**
     * Pipe all redirects through resolve
     */

    function redirect(pathname) {
      return origRedirect.call(res, resolve(pathname));
    }
  };
};
