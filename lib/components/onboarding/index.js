const html = require('choo/html');
const component = require('fun-component');
const { __ } = require('../../locale');

const SPEED_FACTOR = 1000;

module.exports = component({
  name: 'onboarding',
  page: 0,

  load(element) {
    const reel = element.querySelector('.js-reel');

    window.addEventListener('wheel', preventScroll);
    reel.addEventListener('touchmove', preventScroll);

    this.unload = () => {
      window.removeEventListener('wheel', preventScroll);
      reel.removeEventListener('touchmove', preventScroll);
    };

    function preventScroll(event) {
      let node = event.target;

      while (node) {
        if (node === reel) {
          event.preventDefault();
          break;
        }
        node = node.parentElement;
      }
    }
  },

  update(element, [ state, onboarded ]) {
    let currentTime = 0;
    const reel = element.querySelector('.js-reel');
    const { scrollLeft, offsetWidth } = reel;
    const offset = offsetWidth * this.page;

    if (scrollLeft !== offset) {
      // Modulate between 300ms and 800ms animation
      const time = Math.max(0.3, Math.min(Math.abs(scrollLeft - offset) / SPEED_FACTOR, 0.8));

      const tick = () => {
        currentTime += 1 / 60;

        const progress = currentTime / time;
        const factor = easeInOut(progress);

        // As long as progress is greater than 1, keep animating.
        if (progress < 1) {
          requestAnimationFrame(tick);
          reel.scrollLeft = scrollLeft + ((offset - scrollLeft) * factor);
        } else {
          reel.scrollLeft = offset;
          this.render(state, onboarded);
        }
      };

      tick();

    }

    return false;
  },

  render(state, onboarded) {
    const doc = state.content.onboarding;
    const cards = doc.getGroup('onboarding.cards').toArray();
    const onclick = page => event => {
      if (page >= cards.length) {
        onboarded();
      } else {
        this.page = page;
        this.update(state, onboarded);
      }

      event.preventDefault();
    };

    return html`
      <div class="Onboarding">
        <div class="Onboarding-reel js-reel">
          ${ cards.map((card, index) => {
            const image = card.getImage('image');

            return html`
              <article class="Onboarding-card" id="${ this.name }-${ index }">
                ${ image ? html`
                  <div class="Onboarding-container">
                    <img class="Onboarding-image" src="${ image.url }" />
                  </div>
                ` : null }
                <h2 class="Display Display--4">
                  ${ card.getStructuredText('title').asText() }
                </h2>
                <div class="Type">
                  ${ card.getStructuredText('body').asElement() }
                </div>
              </article>
            `;
          }) }
        </div>

        <ol class="Onboarding-pagination">
          ${ cards.map((card, index) => html`
            <li>
              <a href="#${ this.name }-${ index }" class="Onboarding-page ${ this.page === index ? 'is-active' : '' }" onclick=${ onclick(index) }>
                ${ card.getStructuredText('title').asText() }
              </a>
            </li>
          `) }
        </ol>

        ${ typeof window === 'undefined' || this.page === (cards.length - 1) ? html`
          <form action="${ state.href }" method="GET">
            <button type="submit" name="hasBoarded" value="true" class="Button u-block u-sizeFull" onclick=${ onclick(this.page + 1) }>
              ${ __('Close') }
            </button>
          </form>
        ` : html`
          <a href="#${ this.name }-${ this.page + 1 }" class="Button u-block u-sizeFull" onclick=${ onclick(this.page + 1) }>
            ${ __('Next') }
          </a>
        ` }
      </div>
    `;
  }
});

function easeInOut(progress) {
  return (-0.5 * (Math.cos(Math.PI * progress) - 1));
}
