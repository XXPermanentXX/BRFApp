const html = require('choo/html');
const component = require('fun-component');
const { id } = require('../utils');
const { __ } = require('../../locale');

const modal = {
  name: 'modal',
  isOpen: false,

  update(element, args, prev) {

    /**
     * Manually switch modal content on change to preserve the onloadid assigned
     * on first render.
     */

    if (!args[0].isSameNode || !args[0].isSameNode(prev[0])) {
      const content = element.querySelector('.js-content');
      const child = content.firstElementChild;

      if (child.nextElementSibling) {
        content.removeChild(child);
      }

      if (Array.isArray(args[0])) {
        args[0].forEach(next => content.appendChild(next));
      } else {
        content.appendChild(args[0]);
      }
    }

    return false;
  },

  onclose() {
    throw (new Error('No `onclose` method has been assigned'));
  },

  load(element) {
    const onescape = event => ((event.code === 'Escape') && this.close());

    window.addEventListener('keydown', onescape);
    this.unload = () => window.removeEventListener('keydown', onescape);

    this.element = element;
  },

  close() {
    return new Promise(resolve => {
      this.debug('closing');
      this.isOpen = false;

      const ontransitionend = () => {
        this.element.removeEventListener('transitionend', ontransitionend);
        this.element.classList.remove('is-disappearing');

        this.debug('closed');
        this.onclose();
        resolve();
      };

      this.element.addEventListener('transitionend', ontransitionend);
      this.element.classList.add('is-disappearing');
    });
  },

  render(content, onclose) {
    this.onclose = onclose;

    return html`
      <div role="dialog" id="modal-${ id() }" class="Modal ${ typeof window === 'undefined' ? 'is-static' : '' }">
        <div class="Modal-window js-content">
          ${ content }
          <button class="Modal-dismiss" onclick=${ () => this.close() }>
            <span class="Link">${ __('Close') }</span>
          </button>
        </div>
      </div>
    `;
  }
};

module.exports = component(modal);
module.exports.close = () => {
  return modal.close();
};
