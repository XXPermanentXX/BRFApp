const html = require('choo/html')
const component = require('fun-component')
const asElement = require('prismic-element')
const { asText } = require('prismic-richtext')
const { __ } = require('../../locale')

const SPEED_FACTOR = 1000

module.exports = component({
  name: 'onboarding',
  page: 0,

  load (element, state, onboarded) {
    const reel = element.querySelector('.js-reel')

    let timeout
    const onscroll = event => {
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => this.align(reel, state, onboarded), 200)
    }

    reel.addEventListener('scroll', onscroll)

    this.unload = () => {
      reel.removeEventListener('scroll', onscroll)
    }
  },

  update (element, [ state, onboarded ]) {
    this.align(element.querySelector('.js-reel'), state, onboarded)
    return false
  },

  align (reel, state, onboarded) {
    let currentTime = 0
    const { scrollLeft, offsetWidth } = reel
    const offset = offsetWidth * this.page

    if (scrollLeft !== offset) {
      // Modulate between 300ms and 800ms animation
      const time = Math.max(0.3, Math.min(Math.abs(scrollLeft - offset) / SPEED_FACTOR, 0.8))

      const tick = () => {
        currentTime += 1 / 60

        const progress = currentTime / time
        const factor = easeInOut(progress)

        // As long as progress is greater than 1, keep animating.
        if (progress < 1) {
          window.requestAnimationFrame(tick)
          reel.scrollLeft = scrollLeft + ((offset - scrollLeft) * factor)
        } else {
          reel.scrollLeft = offset
          this.render(state, onboarded)
        }
      }

      tick()
    }
  },

  render (state, onboarded) {
    const doc = state.content.onboarding
    const cards = doc.data.cards
    const onclick = page => event => {
      if (page >= cards.length) {
        onboarded()
      } else {
        this.page = page
        this.update(state, onboarded)
      }

      event.preventDefault()
    }

    return html`
      <div class="Onboarding">
        <div class="Onboarding-reel js-reel">
          ${cards.map((card, index) => {
            return html`
              <article class="Onboarding-card" id="${this.name}-${index}">
                ${card.image.url ? html`
                  <div class="Onboarding-container">
                    <img class="Onboarding-image" src="${card.image.url}" />
                  </div>
                ` : null}
                <h2 class="Display Display--4">
                  ${asText(card.title)}
                </h2>
                <div class="Type">
                  ${asElement(card.body)}
                </div>
              </article>
            `
          })}
        </div>

        <ol class="Onboarding-pagination">
          ${cards.map((card, index) => html`
            <li>
              <a href="#${this.name}-${index}" class="Onboarding-page ${this.page === index ? 'is-active' : ''}" onclick=${onclick(index)}>
                ${asText(card.title)}
              </a>
            </li>
          `)}
        </ol>

        ${typeof window === 'undefined' || this.page === (cards.length - 1) ? html`
          <form action="${state.href}" method="GET">
            <button type="submit" name="hasBoarded" value="true" class="Button u-block u-sizeFull" onclick=${onclick(this.page + 1)}>
              ${__('Close')}
            </button>
          </form>
        ` : html`
          <a href="#${this.name}-${this.page + 1}" class="Button u-block u-sizeFull" onclick=${onclick(this.page + 1)}>
            ${__('Next')}
          </a>
        `}
      </div>
    `
  }
})

function easeInOut (progress) {
  return (-0.5 * (Math.cos(Math.PI * progress) - 1))
}
