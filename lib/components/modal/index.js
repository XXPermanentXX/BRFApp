const html = require('choo/html');
const Nanocomponent = require('nanocomponent');
const { __ } = require('../../locale');

class Modal extends Nanocomponent {
  update(children, onclose) {
    this.onclose = onclose;
    if (children && children.isSameNode && this.children) {
      return !children.isSameNode(this.children);
    }
    return children !== this.children;
  }

  onclose() {
    throw (new Error('No `onclose` method has been assigned'));
  }

  load() {
    const onescape = event => {
      if (this.children && event.code === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', onescape);
    this.unload = () => window.removeEventListener('keydown', onescape);
  }

  close() {
    return new Promise(resolve => {
      const element = this.element;
      this.children = null;

      const ontransitionend = () => {
        element.removeEventListener('transitionend', ontransitionend);
        element.classList.remove('is-disappearing');
        this.onclose();
        this.render(false);
        resolve();
      };

      element.addEventListener('transitionend', ontransitionend);
      element.classList.add('is-disappearing');
    });
  }

  placeholder(children = null) {
    if (!this._hasWindow && children) {
      // Reuse last arguments to populate placeholder with static content
      return this.render(children);
    }
    return this.element || this.render(false, this.onclose);
  }

  createElement(children, onclose) {
    if (!children) {
      return html`<div id="modal" class="Modal Modal--placeholder"></div>`;
    }

    this.children = children;
    this.onclose = onclose;

    return html`
      <div role="dialog" id="modal" class="Modal ${ !this._hasWindow ? 'is-static' : '' }">
        <div class="Modal-window">
          ${ children }
          <button class="Modal-dismiss" onclick=${ () => this.close() }>
            <span class="Link">${ __('Close') }</span>
          </button>
        </div>
      </div>
    `;
  }
}

module.exports = new Modal('modal');
