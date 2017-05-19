const assert = require('assert');
const html = require('choo/html');
const morph = require('nanomorph');
const onload = require('on-load');
const nanologger = require('nanologger');
const { id } = require('../utils');
const { __ } = require('../../locale');

let _modal, _onclose, modal;
const uid = `uid_${ id() }`;
const log = nanologger('modal');

module.exports = render;
module.exports.close = close;

/**
 * Attach global listener for escape that closes the modal
 */

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', event => {
    if (_modal && event.code === 'Escape') {
      close();
    }
  });
}

/**
 * The internal render method for generating modal element
 * @param  {Element|Array} content A single or list of elements to show in modal
 * @param  {function}      onclose Function to call when the modal is closed
 * @return {Element}               Modal element
 */

function _render(content, onclose) {
  assert(onclose, 'onclose callback must be provided');

  _onclose = onclose;

  return html`
    <div role="dialog" class="Modal" id=${ uid }>
      <div class="Modal-window">
        ${ content }
        <button class="Modal-dismiss" onclick=${ close }>
          <span class="Link">${ __('Close') }</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Public render method that morphs existing modal if there is one
 * @param  {Element|Array} content A single or list of elements to show in modal
 * @param  {function}      onclose Function to call when the modal is closed
 * @return {Element}               Modal element
 */

function render(content, onclose) {
  if (!modal || typeof window === 'undefined') {
    log.debug('render');

    // Produce a first rendition of the element
    modal = decorate(_render(content, onclose));

    onload(modal,
      // Store an internal reference to the element in the actual DOM
      ref => { _modal = decorate(ref); },
      // Unset all references once the modal is removed from the DOM
      () => { modal = _modal = null; },
      uid
    );
  } else {
    log.debug('update');
    // Morph a new rendition onto the existing element
    morph(_modal, _render(content, onclose));
  }

  return modal;
}

/**
 * Decorate node with `isSameNode` method for more performant DOM diffing
 * @param  {Element} node An element node that is to skip DOM diffing
 * @return {Element}      Decorated node
 */

function decorate(node) {
  node.isSameNode = target => target.id === uid;
  return node;
}

/**
 * Public close method for dismissing the modal window
 * @return {Promise} Resolves once animation has finished
 */

function close() {
  return new Promise((resolve, reject) => {
    if (!_modal) {
      reject(new Error('Modal must be rendered before it can be closed'));
      return;
    }

    log.debug('closing');

    _modal.addEventListener('transitionend', function ontransitionend() {
      _modal.removeEventListener('transitionend', ontransitionend);
      _modal.classList.remove('is-disappearing');

      log.debug('closed');

      if (_onclose) {
        _onclose();
      }

      resolve();
    });

    _modal.classList.add('is-disappearing');
  });
}
