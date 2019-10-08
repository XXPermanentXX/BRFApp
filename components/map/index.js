const html = require('choo/html')
const Component = require('choo/component')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const modal = require('../modal')
const Mapbox = require('./mapbox')
const Filter = require('./filter')
const signup = require('../auth/signup')
const { __ } = require('../../lib/locale')
const resolve = require('../../lib/resolve')

module.exports = class MapExplorer extends Component {
  constructor (id, state, emit) {
    super(id)
    this.id = id
    this.filter = {}
    this.cache = state.cache
    this.state = state
    this.emit = emit
    this.modal = null
  }

  update () {
    if (this.modal) {
      modal.render(this.modal(), () => { this.modal = null })
    }

    return true
  }

  createElement () {
    this.cooperatives = this.state.cooperatives.map(item => item._id)

    const { user, geoip } = this.state
    const cooperatives = Filter.apply(this.state.cooperatives, this.filter)

    const renderFilter = () => {
      return this.cache(Filter, this.id + '-filter').render(
        this.state.cooperatives,
        (props) => {
          if (props._id) {
            this.cache(Mapbox, this.id + '-mapbox').select(props._id)
          } else {
            this.filter = props
          }
          this.modal = null
          modal.close()
          this.rerender()
        }
      )
    }

    const openModal = (content) => (event) => {
      this.modal = content
      modal.render(this.modal(), () => { this.modal = null })
      event.preventDefault()
    }

    const renderSignup = () => {
      const doc = this.state.content.registration
      if (!doc) {
        this.emit('content:fetch', 'registration')
        return modal.loader()
      }
      return html`
        <div class="u-sizeFullV u-paddingTl u-paddingHm u-paddingBm">
          ${signup(html`
            <div>
              <h1 class="Display Display--2 u-textCenter">${asText(doc.data.disclaimer_title)}</h1>
              <div class="Type">${asElement(doc.data.disclaimer_body)}</div>
            </div>
          `)}
        </div>
      `
    }

    let center
    if (user) {
      const home = this.state.cooperatives.find(item => {
        return item._id === user.cooperative
      })
      center = home && { longitude: home.lng, latitude: home.lat }
    }

    if (!center) {
      const { latitude, longitude, precision } = geoip
      center = { latitude, longitude, precision }
    }

    if (this.modal) {
      modal.render(this.modal(), () => { this.modal = null })
    }

    return html`
      <div class="Map u-hiddenNoScript" id="map-container">
        ${this.cache(Mapbox, this.id + '-mapbox').render(cooperatives, center)}

        <div class="Map-recruit" id="map-recruit">
          ${!this.state.user ? html`
            <div class="Map-panel" id="map-recruit-panel">
              ${__('Missing your cooperative?') + ' '} <a href="${resolve('/auth/sign-up')}" onclick=${openModal(renderSignup)}>${__('Add your cooperative')}</a>
            </div>
          ` : null}
          <button class="Button" onclick=${openModal(renderFilter)} style="margin-left: auto;">
            ${__('Search and filter')} ${Object.keys(this.filter).length ? ` (${cooperatives.length})` : ''}
          </button>
        </div>

        <div class="Map-controls" id="map-recruit">
          ${!this.state.user ? html`
            <a href="${resolve('/auth/sign-up')}" onclick=${openModal(renderSignup)} class="Button u-flexGrow1" id="map-recruit-button">
              ${__('Add your cooperative')}
            </a>
          ` : null}
          <button class="Button u-flexGrow1" onclick=${openModal(renderFilter)}>
            ${__('Search and filter')} ${Object.keys(this.filter).length ? ` (${cooperatives.length})` : ''}
          </button>
        </div>

        ${geoip.precision !== 'exact' ? html`
          <div class="Map-locate">
            <button class="Button Button--round u-textS" onclick=${() => this.emit('geoip:getPosition')} disabled=${!!geoip.isLoading}>
              ${__('Find me')}
            </button>
          </div>
        ` : null}
      </div>
    `
  }
}
