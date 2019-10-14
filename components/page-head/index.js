const html = require('choo/html')
const Component = require('choo/component')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const logo = require('./logo')
const menu = require('../menu')
const modal = require('../modal')
const signin = require('../auth/signin')
const signup = require('../auth/signup')
const { __ } = require('../../lib/locale')
const resolve = require('../../lib/resolve')
const { chevron } = require('../icons')

module.exports = class PageHead extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state
    this.emit = emit
    this.href = null
    this.modal = null
    this.isExpanded = false
    this.allowRender = false
  }

  update () {
    if (this.modal) {
      modal.render(this.modal(), () => {
        this.modal = null
      })
    }

    /**
     * Close menu drop down on navigate
     */

    if (this.state.href !== this.href) {
      this.isExpanded = false
      return true
    }

    return this.allowRender
  }

  setModal (fn) {
    this.modal = render
    modal.render(render(), () => {
      this.modal = null
    })

    function render (...args) {
      return html`
        <div class="u-sizeFullV u-paddingTl u-paddingHm u-paddingBm">
          ${fn(...args)}
        </div>
      `
    }
  }

  createElement () {
    this.href = this.state.href

    const self = this
    const user = this.state.user
    const toggle = open => event => {
      this.isExpanded = open
      this.rerender()
      event.preventDefault()
    }

    var visiblePages = [home, about, faq, auth, tracking]
    var mediumHorizontalPages = [faq, about]
    var mediumDropdownPages = [home, auth, tracking]

    return html`
      <div class="PageHead">
        <a href=${resolve('/')} class="PageHead-title">
          ${logo()} Brf Energi
        </a>
        <nav class="PageHead-navigation">

          <!-- Small viewport: drop down menu list -->
          <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden ${this.isExpanded ? 'is-open' : ''}">
            ${menu(visiblePages.map(page => page(this.state, this.emit)).filter(Boolean))}
          </div>

          <!-- Medium & large viewport: drop down menu list -->
          ${user ? html`
            <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block ${this.isExpanded ? 'is-open' : ''}">
              ${menu(mediumDropdownPages.map(page => page(this.state, this.emit)).filter(Boolean))}
            </div>
          ` : null}

          <!-- Medium & large viewport: horizontal menu list -->
          <ul class="u-hidden u-md-block u-lg-block">
            ${mediumHorizontalPages.map(page => {
              const props = page(this.state, this.emit)
              return html`
                <li class="PageHead-item">
                  <a href=${props.href} class="PageHead-link">${props.title}</a>
                </li>
              `
            })}
          </ul>

          <!-- Small viewport: open drop down menu -->
          <a href="#page-menu-sm" onclick=${toggle(true)} class="PageHead-trigger PageHead-trigger--small PageHead-link">
            ${__('Menu')} ${chevron('down')}
          </a>

          <!-- Medium & large viewport: open drop down menu -->
          ${user
            // Render user menu anchor link
            ? html`
              <a href="#page-menu-lg" onclick=${toggle(true)} class="PageHead-trigger PageHead-trigger--large PageHead-link">
                ${__('Menu')} ${chevron('down')}
              </a>
            `
            // Render sign in link
            : (function (props) {
              return html`
                <a href=${props.href} class="PageHead-link PageHead-trigger PageHead-trigger--large" onclick=${props.onclick}>
                  ${props.title}
                </a>
              `
            }(auth(this.state, this.emit)))
          }

          <!-- All viewports: close drop down menu -->
          <a href="#page-head" onclick=${toggle(false)} class="PageHead-untrigger PageHead-link" hidden data-title-small=${__('Close') + ' '} data-title-large=${(user ? __('Menu') : __('Close')) + ' '}>
            ${chevron('up')}
          </a>
        </nav>
      </div>
    `

    function home (state) {
      if (!state.user) return null
      const cooperative = state.cooperatives.find(props => {
        return props._id === state.user.cooperative
      })
      return {
        href: resolve(`/cooperatives/${state.user.cooperative}`),
        title: cooperative.name || __('My cooperative')
      }
    }

    function about () {
      return {
        href: resolve('/about-the-project'),
        title: __('About Brf Energi')
      }
    }

    function faq () {
      return {
        href: resolve('/how-it-works'),
        title: __('How it works')
      }
    }

    function auth (state, emit) {
      return {
        href: resolve(state.user ? '/auth/signout' : '/auth'),
        title: state.user ? __('Sign out') : __('Sign in'),
        onclick: event => {
          if (state.user) {
            window.location.assign(resolve('/auth/signout'))
          } else {
            self.isExpanded = false

            if (!state.content['sign-in']) emit('content:fetch', 'sign-in')

            self.setModal(function () {
              const doc = state.content['sign-in']
              if (!doc) return modal.loader()
              return signin(html`
                <div>
                  <h1 class="Display Display--2 u-textCenter">${asText(doc.data.title)}</h1>
                  <div class="Type">${asElement(doc.data.body)}</div>
                </div>
              `, onsignup)
            })
          }

          event.preventDefault()
        }
      }

      function onsignup (event) {
        if (!state.content.registration) emit('content:fetch', 'registration')

        self.setModal(function () {
          const doc = state.content.registration
          if (!doc) return modal.loader()
          return signup(html`
            <div>
              <h1 class="Display Display--2 u-textCenter">${asText(doc.data.disclaimer_title)}</h1>
              <div class="Type">${asElement(doc.data.disclaimer_body)}</div>
            </div>
          `)
        })
      }
    }

    function tracking (state, emit) {
      if (!state.user) return null
      if (!state.user.isAdmin) return null
      const next = state.tracking.enabled ? 'off' : 'on'
      return {
        href: `/tracking${next}?referrer=${encodeURIComponent(state.href)}`,
        title: __(`${state.tracking.enabled ? 'Disable' : 'Enable'} tracking`),
        onclick: (event) => {
          emit('track:toggle', !state.tracking.enabled)
          this.isExpanded = false
          this.rerender()
          event.preventDefault()
        }
      }
    }
  }
}
