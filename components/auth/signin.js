const html = require('choo/html')
const { input } = require('../form')
const { follow } = require('../base')
const divider = require('../divider')
const resolve = require('../../lib/resolve')
const { __ } = require('../../lib/locale')

module.exports = login

function login (content = null, callback = null) {
  return html`
    <form method="post" action="/auth">
      ${content ? html`<div class="u-marginBm">${content}</div>` : null}
      ${input({ label: __('E-mail'), name: 'email', type: 'email', autocomplete: 'email', required: true })}
      ${input({ label: __('Password'), name: 'password', type: 'password', autocomplete: 'current-password', required: true })}
      <div class="u-flex u-marginVm">
        <a href="${resolve('/auth/sign-up')}" onclick=${onclick} class="Button u-flexGrow1 u-marginRs">
          ${__('Create an account')}
        </a>
        <button type="submit" class="Button u-flexGrow1">
          ${__('Sign in')}
        </button>
      </div>
      <div class="u-marginVm">${divider(__('or'))}</div>
      <div class="Type">
        ${__('If you have a Metry account you may')} <a href="${resolve('/auth/metry')}" onclick=${follow}>
          ${__('sign in with Metry')}
        </a>.
      </div>
    </form>
  `

  function onclick (event) {
    if (typeof callback !== 'function') return
    callback(event.currentTarget)
    event.preventDefault()
  }
}
