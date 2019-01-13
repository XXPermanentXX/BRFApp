var html = require('choo/html')

module.exports = divider

function divider (text) {
  return html`
    <div class="Divider">
      <hr class="Divider-line">
      ${text ? [
        html`<em class="Divider-text">${text}</em>`,
        html`<hr class="Divider-line">`
      ] : null}
    </div>
  `
}
