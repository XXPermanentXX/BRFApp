const assert = require('assert');
const html = require('choo/html');
const morph = require('nanomorph');
const { id } = require('../utils');
const { __ } = require('../../locale');

let _onclose, modal;
const uid = `uid_${ id() }`;

module.exports = render;
module.exports.close = close;

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', event => {
    if (event.code === 'Escape') {
      close().then(() => {
        if (_onclose) {
          _onclose();
        }
      });
    }
  });
}

function _render(content, onclose) {
  assert(onclose, 'onclose callback must be provided');

  if (_onclose) {
    _onclose();
  }
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

function render(content, onclose) {
  if (!modal || typeof window === 'undefined') {
    modal = _render(content, onclose);
    modal.isSameNode = target => target.id === uid;
  } else {
    morph(modal, _render(content, onclose));
  }

  return modal;
}

function close() {
  return new Promise((resolve, reject) => {
    if (!modal) {
      reject(new Error('Modal must be rendered before it can be closed'));
      return;
    }

    modal.addEventListener('transitionend', function ontransitionend() {
      modal.removeEventListener('transitionend', ontransitionend);
      modal.classList.remove('is-disappearing');
      resolve();
    });

    modal.classList.add('is-disappearing');
  });
}
