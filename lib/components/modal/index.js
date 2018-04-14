const html = require('choo/html')
const Component = require('choo/component')
const { __ } = require('../../locale')

class Modal extends Component {
  update (children, onclose) {
    this.onclose = onclose
    if (children && children.isSameNode && this.children) {
      return !children.isSameNode(this.children)
    }
    return children !== this.children
  }

  load () {
    const onescape = event => {
      if (this.children && event.code === 'Escape') {
        this.close()
      }
    }
    window.addEventListener('keydown', onescape)
    this.unload = () => window.removeEventListener('keydown', onescape)
  }

  close () {
    const element = this.element
    this.children = null

    return new Promise(resolve => {
      const ontransitionend = () => {
        element.removeEventListener('transitionend', ontransitionend)
        element.classList.remove('is-disappearing')
        if (this.onclose) this.onclose()
        this.render(false)
        resolve()
      }

      element.addEventListener('transitionend', ontransitionend)
      element.classList.add('is-disappearing')
    })
  }

  placeholder () {
    if (!this._hasWindow) return this.render()
    return this.render(this.children, this.onclose)
  }

  createElement (children, onclose) {
    if (!children) {
      return html`<div id="modal" class="Modal Modal--placeholder"></div>`
    }

    this.children = children
    this.onclose = onclose

    return html`
      <div role="dialog" id="modal" class="Modal ${!this._hasWindow ? 'is-static' : ''}">
        <div class="Modal-window">
          ${children}
          <button class="Modal-dismiss" onclick=${() => this.close()}>
            <span class="Link">${__('Close')}</span>
          </button>
        </div>
      </div>
    `
  }
}

module.exports = new Modal('modal')
