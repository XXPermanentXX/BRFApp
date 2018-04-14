const html = require('choo/html')
const Component = require('choo/component')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const modal = require('../modal')
const Mapbox = require('./mapbox')
const Filter = require('./filter')
const { follow } = require('../utils')
const { loader } = require('../icons')
const { __ } = require('../../locale')
const resolve = require('../../resolve')

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
    if (!this.registration && this.state.content.registration) {
      modal.render(this.modal(), () => { this.modal = null })
    }

    return this.cooperatives.reduce((shouldUpdate, cooperative, index) => {
      return shouldUpdate || cooperative._id !== this.cooperatives[index]
    }, false)
  }

  createElement () {
    this.registration = this.state.content.registration
    this.cooperatives = this.state.cooperatives.map(item => item._id)

    let center
    const { user, geoip } = this.state

    const onfilter = (props) => {
      this.filter = props
      this.modal = null
      modal.close()
      this.rerender()
    }
    const filter = () => this.cache(Filter, this.id + '-filter').render(onfilter)

    const openModal = (content) => (event) => {
      this.modal = content
      modal.render(this.modal(), () => { this.modal = null })
      event.preventDefault()
    }

    const signup = () => {
      if (!this.registration) {
        this.emit('content:fetch', 'registration')
        return html`
          <div class="u-marginVl u-textCenter u-colorSky">
            ${loader()}
          </div>
        `
      }

      return html`
        <div class="u-flex u-flexCol u-sizeFullV">
          <div class="u-flexGrow1 u-paddingVl u-paddingHm">
            <h1 class="Display Display--2 u-textCenter">
              ${asText(this.registration.data.disclaimer_title)}
            </h1>
            <div class="Type">
              ${asElement(this.registration.data.disclaimer_body)}
            </div>
          </div>
          <a href="${resolve('/auth/metry/sign-up')}" onclick=${follow} class="Button u-flexShrink0">
            ${__('Create an account')}
          </a>
        </div>
      `
    }

    if (user.isAuthenticated) {
      const home = this.state.cooperatives.find(item => {
        return item._id === user.cooperative
      })
      center = home && { longitude: home.lng, latitude: home.lat }
    }

    if ((!center || geoip.precision === 'exact') && geoip.longitude) {
      center = {
        longitude: geoip.longitude,
        latitude: geoip.latitude,
        isLoading: geoip.isLoading,
        precision: geoip.precision
      }
    }

    if (typeof window !== 'undefined' && !center) {
      this.emit('geoip:fetch')
    }

    if (this.modal) {
      modal.render(this.modal(), () => { this.modal = null })
    }

    const filters = Object.keys(this.filter)
    let cooperatives = this.state.cooperatives
    if (filters.length) {
      cooperatives = cooperatives.filter((cooperative) => {
        for (let i = 0, len = filters.length, key, value; i < len; i++) {
          key = filters[i]
          value = this.filter[key]

          if (typeof value === 'string') {
            value = value.toLowerCase()
            // Match text content
            if (cooperative[key].toLowerCase().indexOf(value) === -1) {
              return false
            }
          } else {
            if (key === 'hasEnergyProduction') {
              // Proxy all types of energy production
              if (cooperative.hasSolarPanels !== value) return false
              if (cooperative.hasGeothermalHeating !== value) return false
            }
            // Compare boolean values
            if (cooperative[key] !== value) return false
          }
        }

        return true
      })
    }

    return html`
      <div class="Map u-hiddenNoScript" id="map-container">
        ${this.cache(Mapbox, this.id + '-mapbox').render(cooperatives, center)}

        <div class="Map-recruit" id="map-recruit">
          ${!this.state.user.isAuthenticated ? html`
            <div class="Map-panel" id="map-recruit-panel">
              ${__('Missing your cooperative?') + ' '} <a href="${resolve('/auth/sign-up')}" onclick=${openModal(signup)}>${__('Add your cooperative')}</a>
            </div>
          ` : null}
          <button class="Button" onclick=${openModal(filter)} style="margin-left: auto;">
            ${__('Find cooperative')}
          </button>
        </div>

        <div class="Map-controls" id="map-recruit">
          ${!this.state.user.isAuthenticated ? html`
            <a href="${resolve('/auth/sign-up')}" onclick=${openModal(signup)} class="Button u-flexGrow1" id="map-recruit-button">
              ${__('Add your cooperative')}
            </a>
          ` : null}
          <button class="Button u-flexGrow1" onclick=${openModal(filter)}>
            ${__('Find cooperative')}
          </button>
        </div>
      </div>
    `
  }
}
