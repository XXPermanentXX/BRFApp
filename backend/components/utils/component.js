const onload = require('on-load');
const nanologger = require('nanologger');
const morph = require('nanomorph');
const { id } = require('./index');

/**
 * @name component
 * Lifecycle hooks for a cached element.
 * Takes either a function or an object with a render method and optional hooks.
 *
 * @name render
 * @description Should return the component element
 *
 * @name shouldUpdate
 * @description Determine wether the component will update
 *
 * @name update
 * @description Modify component on consecutive render calls
 *
 * @name onload
 * @description Called when component is mounted in the DOM
 *
 * @name unload
 * @description Called when component is removed from the DOM
 *
 * @example
 * cache(user => html`<a href="/users/${ user._id }`>${ user.name }</a>`)
 *
 * @example
 * component({
 *   shouldUpdate(args, prev) {
 *     return args[0].lng !== prev[0].lng || args[0].lat !== prev[0].lat;
 *   },
 *   update(coordinates, emit) {
 *     map.setCenter([coordinates.lng, coordinates.lat]);
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
 *
 * @param  {(Function|Object)}    props Function or Object
 * @return {Function}                   Renders component
 */

module.exports = function component(props) {
  let _args, _element, _render, ctx, element;
  const uid = `cache-${ id() }`;
  const log = nanologger(props.name || uid);

  log.debug('create');

  if (typeof props === 'function') {
    _render = props;
  } else if (typeof props.render === 'function') {
    ctx = props;
    _render = props.render;
  } else {
    throw (new Error('Cache must be provided with a render function'));
  }

  let shouldUpdate = props.shouldUpdate;
  if (typeof shouldUpdate !== 'function') {
    if (typeof shouldUpdate !== 'undefined') {
      // Support for shouldUpdate being a truthy/falsy value
      shouldUpdate = () => props.shouldUpdate;
    } else {
      shouldUpdate = (args, prev) => {
        // A different set of arguments issues a rerender
        if (args.length !== prev.length) { return true; }

        // Check for challow diff in list of arguments
        return args.reduce((diff, arg, index) => {
          return diff || arg !== prev[index];
        }, false);
      };
    }
  }

  const _update = props.update;
  props.update = update;

  /**
   * Update existing element given new arguments
   * @param  {Array} args Arguments supplied by caller
   * @return {void}
   */

  function update(...args) {
    log.debug('update');

    if (typeof _update === 'function') {
      // Relay to custom user defined update method
      _update.call(ctx, _element, ...args);
    } else {
      // Produce a rendition given the new arguments
      let tree = _render.call(ctx, ...args);
      tree.id = uid;

      // Morph the new rendition onto the existing element
      morph(_element, tree);

      // Spare the garbage collector
      tree = null;
    }

    // Cache arguments for diffing
    _args = args;
  }

  return function render(...args) {
    if (!element || typeof window === 'undefined') {
      log.debug('render');

      // Produce a first rendition of the element
      element = decorate(_render.call(ctx, ...args));

      onload(element, node => {
        // Store an internal reference to the node actually mounted in the DOM
        _element = decorate(node);

        if (typeof props.onload === 'function') {
          requestAnimationFrame(() => {
            log.debug('load');
            props.onload(_element, ..._args);
          });
        }
      }, () => {
        if (typeof props.unload === 'function') {
          requestAnimationFrame(() => {
            log.debug('unload');
            props.unload(_element, ..._args);
          });
        }
      }, uid);
    } else if (shouldUpdate.call(ctx, args, _args || [])) {
      update(...args);
    }

    // Cache arguments for diffing
    _args = args;

    // Return the most accurate rendition that we have
    return _element || element;
  };

  /**
   * Decorate a node with the necessities for speedy DOM diffing
   * @param  {Element} node The root node of a tree that is to forego diffing
   * @return {Element}      Decorated node
   */

  function decorate(node) {
    node.id = uid;
    node.isSameNode = target => target.id === uid;
    return node;
  }
};
