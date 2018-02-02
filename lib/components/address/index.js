const html = require('choo/html')
const component = require('fun-component')
const { input } = require('../form')
const { className } = require('../utils')
const { __ } = require('../../locale')

module.exports = component({
  name: 'address',
  isLoading: false,
  address: '',
  postalTown: '',
  postalCode: '',

  unload () {
    this.address = ''
    this.postalTown = ''
    this.postalCode = ''
  },

  render (props, onlocate) {
    let timeout
    const oninput = event => {
      if (event.key === 'Enter') return event.preventDefault()
      if (event.target.name === 'address' && event.target.value.length < 3) {
        delete this[event.target.name]
        return
      }

      this[event.target.name] = event.target.value

      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        if (!this.address || !this.postalCode || !this.postalTown) return

        this.isLoading = true
        this.render(props, onlocate)
        window.fetch(getGeocodeURL(this))
          .then(response => response.json())
          .then(data => {
            const result = data.results.find(result => {
              return result.types.includes('street_address')
            })

            this.isLoading = false
            if (result) {
              const components = result.address_components
              const num = getComponent('street_number', components)
              const street = getComponent('route', components)
              this.address = `${street} ${num}`
              this.postalCode = getComponent('postal_code', components)
              this.postalTown = getComponent('postal_town', components)
              onlocate(Object.assign({
                address: this.address,
                postalCode: this.postalCode,
                postalTown: this.postalTown
              }, result.geometry.location))
            } else {
              this.render(Object.assign({}, props, {isValid: false}), onlocate)
            }
          })
      }, 250)
    }

    this.address = this.address || props.address
    this.postalCode = this.postalCode || props.postalCode
    this.postalTown = this.postalTown || props.postalTown

    return html`
      <div class="Address">
        <div class="Form-collapse">
          ${input({ label: __('Address'), class: 'Address-street', required: true, name: 'address', value: this.address || '', autocomplete: 'street-address', oninput: oninput })}
          ${input({ label: __('Postnummer'), class: 'Address-postalCode', required: true, name: 'postalCode', value: this.postalCode || '', autocomplete: 'postal-code', oninput: oninput })}
          ${input({ label: __('Ort'), class: 'Address-postalTown', required: true, name: 'postalTown', value: this.postalTown || '', autocomplete: 'address-level2', oninput: oninput })}
        </div>
        <div class="${className('Address-validity', {'is-valid': !this.isLoading && props.isValid, 'is-invalid': !this.isLoading && !props.isValid, 'is-loading': this.isLoading})}">
          ${!this.isLoading && !props.isValid && this.address && this.postalCode && this.postalTown ? __('Did not recognize the address') : null}
        </div>
      </div>
    `
  }
})

// get component by type
// (str, arr) -> str
function getComponent (type, components) {
  const component = components.find(item => item.types.includes(type))
  return component ? component.long_name : ''
}

// get geocode resource url
// obj -> str
function getGeocodeURL (values) {
  return [
    `https://maps.googleapis.com/maps/api/geocode/json?address=${values.address}`,
    'language=sv',
    'region=sv',
    `components=postal_code:${values.postalCode}|postal_town:${values.postalTown}|country:SE`,
    `key=${process.env.GOOGLE_GEOCODE_KEY}`
  ].join('&')
}
