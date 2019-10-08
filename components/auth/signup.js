const html = require('choo/html')
const { input } = require('../form')
const { __ } = require('../../lib/locale')

module.exports = signup

function signup (content = null) {
  return html`
    <form method="post" action="/auth/sign-up" onsubmit=${onsubmit}>
      <div class="u-flexGrow1 u-marginBm">
        ${content ? html`<div class="u-marginBm">${content}</div>` : null}
        ${input({ label: __('Your name'), name: 'fullname', type: 'text', required: true })}
        ${input({ label: __('E-mail'), name: 'email', type: 'email', autocomplete: 'email', required: true })}
        ${input({ label: __('Password'), name: 'password', type: 'password', autocomplete: 'new-password', minlength: 6, required: true })}
      </div>
      <button type="submit" class="Button u-block u-sizeFull">${__('Create an account')}</button>
    </form>
  `

  function onsubmit (event) {
    if (!event.target.checkValidity()) {
      event.target.reportValidity()
      event.preventDefault()
    }
  }
}
