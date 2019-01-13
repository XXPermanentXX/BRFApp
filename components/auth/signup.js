const html = require('choo/html')
const { input } = require('../form')
const { __ } = require('../../lib/locale')

module.exports = signup

function signup (content = null, callback = null) {
  return html`
    <form method="post" action="/auth">
      <input type="hidden" name="create" value="true">
      <div class="u-flexGrow1 u-marginBm">
        ${content ? html`<div class="u-marginBm">${content}</div>` : null}
        ${input({ label: __('E-mail'), name: 'email', type: 'email', autocomplete: 'email', required: true })}
        ${input({ label: __('Password'), name: 'password', type: 'password', autocomplete: 'new-password', required: true })}
      </div>
      <button type="submit" class="Button u-block u-sizeFull">${__('Create account')}</button>
    </form>
  `
}
