const html = require('choo/html');
const component = require('../utils/component');
const { __ } = require('../../locale');

function Modal(...args) {
  if (!(this instanceof Modal)) { return new Modal(...args); }
}

Modal.prototype = Object.create({
  name: 'modal',

  onclose() {
    throw (new Error('No `onclose` method has been assigned'));
  },

  onload(element, content, onclose) {
    const onescape = event => ((event.code === 'Escape') && this.close());

    window.addEventListener('keydown', onescape);
    this.unload = () => window.removeEventListener('keydown', onescape);

    this.onclose = onclose;
    this.element = element;
  },

  close() {
    return new Promise(resolve => {
      this.debug('closing');

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
      <div role="dialog" class="Modal">
        <div class="Modal-window">
          ${ content }
          <button class="Modal-dismiss" onclick=${ () => this.close() }>
            <span class="Link">${ __('Close') }</span>
          </button>
        </div>
      </div>
    `;
  }
});

const modal = new Modal();
module.exports = component(modal);
module.exports.close = () => {
  return modal.close();
};
