const html = require('choo/html');
const component = require('../utils/component');
const { id } = require('../utils');
const { __ } = require('../../locale');

const modal = {
  name: 'modal',
  isOpen: false,

  onclose() {
    throw (new Error('No `onclose` method has been assigned'));
  },

  load(element, content, onclose) {
    const onescape = event => ((event.code === 'Escape') && this.close());

    window.addEventListener('keydown', onescape);
    this.unload = () => window.removeEventListener('keydown', onescape);
    element.classList.add('is-open');

    this.onclose = onclose;
    this.element = element;
    this.isOpen = true;
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
      <div role="dialog" id="modal-${ id() }" class="Modal ${ this.isOpen ? 'is-open' : '' }">
        <div class="Modal-window">
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
