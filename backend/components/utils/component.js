const nanologger = require('nanologger');
const Nanocomponent = require('nanocomponent');
const nanomorph = require('nanomorph');

/**
 * Lifecycle hooks for a statefull component.
 *
 * @param {any} props Function or Object
 * @param {string} props.name Component name, used for debugging
 * @param {boolean} props.cache Cache the component between mounts
 * @param {function} props.render Should return the component element
 * @param {function} props.shouldUpdate Determine wether the component will update
 * @param {function} props.update Modify component on consecutive render calls
 * @param {function} props.onload Called when component is mounted in the DOM
 * @param {function} props.unload Called when component is removed from the DOM
 * @returns {function} Renders component
 *
 * @example
 * component(user => html`<a href="/users/${ user._id }`>${ user.name }</a>`)
 *
 * @example
 * component({
 *   name: 'map',
 *   shouldUpdate([coordinates], [prevCoordinates]) {
 *     return coordinates.lng !== prevCoordinates.lng || coordinates.lat !== prevCoordinates.lat;
 *   },
 *   update(element, coordinates, emit) {
 *     this.map.setCenter([coordinates.lng, coordinates.lat]);
 *   },
 *   onload(element, coordinates, emit) {
 *     this.map = new mapboxgl.Map({
 *       container: element,
 *       center: [coordinates.lng, coordinates.lat],
 *     });
 *   },
 *   unload() {
 *     this.map.destroy();
 *   },
 *   render(coordinates, emit) {
 *     return html`<div class="Map"></div>`;
 *   }
 * })
 */

module.exports = function component(props) {
  let _args, _element, _render, _update, ctx;

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props === 'object' && props.render) {
    ctx = props;
    _render = props.render;
    _update = props.update;
  } else {
    throw (new Error('Component must be provided with a render function'));
  }

  let shouldUpdate = props.shouldUpdate;
  if (!shouldUpdate) {
    shouldUpdate = (args, prev) => {
      // A different set of arguments issues a rerender
      if (args.length !== prev.length) { return true; }

      // Check for challow diff in list of arguments
      return args.reduce((diff, arg, index) => {
        if (prev[index] && prev[index].isSameNode && arg instanceof Element) {
          return diff || !arg.isSameNode(prev[index]);
        } else if (typeof arg === 'function') {
          return diff || arg.toString() !== prev[index].toString();
        } else {
          return diff || arg !== prev[index];
        }
      }, false);
    };
  }

  function Component() {
    Nanocomponent.call(this);
    this.log = nanologger(props.name || this._ID);
    props.debug = (...args) => this.log.debug(args[0], args.slice(1));
    props.update = (...args) => this.update(...args);
    this.log.debug('create');
  }

  Component.prototype = Object.create(Nanocomponent.prototype);

  Component.prototype.update = function (...args) {
    this.log.debug('update', args);
    if (_update) {
      _update.call(ctx, this._element, ...args);
    } else {
      nanomorph(this._element, _render.apply(ctx, args));
    }
  };

  Component.prototype._render = function(...args) {
    _args = args;

    if (((props.cache && _element) || this._element) && this._hasWindow) {
      this.update(...args);
    } else {
      this.log.debug('render', args);
      _element = _render.apply(ctx, args);
    }

    return _element;
  };

  Component.prototype._update = (...args) => {
    return shouldUpdate.call(ctx, args, _args);
  };

  Component.prototype._load = function() {
    if (props.onload) {
      props.onload(this._element, ..._args);
    }
  };

  Component.prototype._unload = function() {
    if (!props.cache) {
      _element = null;
    }

    if (props.unload) {
      props.unload(..._args);
    }
  };

  const instance = new Component();
  return (...args) => instance.render(...args);
};
