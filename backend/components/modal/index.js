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

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape') {
      close();
    }
  });
}

function _render(content, onclose) {
  assert(onclose, 'onclose callback must be provided');

  _onclose = onclose;

  return html`
    <div role="dialog" class="Modal" id=${ uid }>
      <div class="Modal-window js-modalWindow">
        ${ content }
        <button class="Modal-dismiss" onclick=${ close }>
          <span class="Link">${ __('Close') }</span>
        </button>
      </div>
    </div>
  `;
}

function render(content, onclose) {
  if (!modal || typeof window === 'undefined') {
    log.debug('render');
    modal = _render(content, onclose);
    modal.isSameNode = target => target.id === uid;
    onload(
      modal,
      ref => { _modal = ref; },
      () => { modal = _modal = null; }
    );
  } else {
    log.debug('update');
    morph(_modal, _render(content, onclose));
  }

  return modal;
}

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
