const html = require('choo/html');
const { debounce } = require('../utils');
const component = require('../utils/component');
const { __ } = require('../../locale');

const SPEED_FACTOR = 1000;

module.exports = component({
  name: 'onboarding',
  page: 0,

  onload(element, doc, onboarded) {
    let timeout;
    let scrollstart = null;
    let inTransition = false;

    const cards = doc.getGroup('onboarding.cards').toArray();

    const next = element.querySelector('.js-next');
    const reel = element.querySelector('.js-reel');
    let { offsetWidth } = reel;

    const justify = (extra = 0) => {
      const { scrollLeft } = reel;
      let frame = Math.max(0, Math.ceil(cards.length * (scrollLeft / offsetWidth)) - 1);

      if ((frame + extra) < 0) {
        frame = 0;
      } else if ((frame + extra) > (cards.length - 1)) {
        frame = cards.length - 1;
      } else {
        frame += extra;
      }

      const offset = offsetWidth * frame;

      // Modulate between 300ms and 800ms animation
      const time = Math.max(0.3, Math.min(Math.abs(scrollLeft - offset) / SPEED_FACTOR, 0.8));

      let currentTime = 0;

      inTransition = true;

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
          inTransition = false;
          this.page = frame;
          this.update(doc, onboarded);
        }
      };

      tick();
    };

    window.addEventListener('resize', debounce(() => {
      offsetWidth = reel.offsetWidth;
    }, 200));

    next.addEventListener('click', event => {
      if (this.page === cards.length - 1) {
        onboarded();
      } else {
        justify(1);
      }

      event.preventDefault();
    });

    reel.addEventListener('scroll', () => {
      const { scrollLeft } = reel;

      if (inTransition) {
        event.preventDefault();
        return;
      }

      if (!scrollstart) {
        scrollstart = scrollLeft;
        return;
      }

      clearTimeout(timeout);

      const delta = scrollstart - scrollLeft;
      if (Math.abs(delta) > (offsetWidth / 5)) {
        justify(delta > 0 ? -1 : 1);
        scrollstart = null;
      } else {
        timeout = setTimeout(() => {
          scrollstart = null;
          justify();
        }, 100);
      }
    });

    reel.addEventListener('touchmove', event => {
      if (inTransition) {
        event.preventDefault();
      }
    });

    reel.addEventListener('touchend', event => {
      if (event.touches.length) { return; }
      clearTimeout(timeout);
      justify();
    });
  },

  render(doc) {
    const cards = doc.getGroup('onboarding.cards').toArray();

    return html`
      <div class="Onboarding">
        <div class="Onboarding-reel js-reel">
          ${ cards.map(card => {
            const image = card.getImage('image');

            return html`
              <article class="Onboarding-card">
                ${ image ? html`
                  <img class="Onboarding-image" src=${ image.url } />
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
              <button class="Onboarding-page ${ this.page === index ? 'is-active' : '' }">
                ${ card.getStructuredText('title').asText() }
              </button>
            </li>
          `) }
        </ol>

        <button class="Button u-block u-sizeFull js-next">
          ${ this.page === cards.length - 1 ? __('Close') : __('Next') }
        </button>
      </div>
    `;
  }
});

function easeInOut(progress) {
  return (-0.5 * (Math.cos(Math.PI * progress) - 1));
}
