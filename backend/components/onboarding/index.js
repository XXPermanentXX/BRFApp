const html = require('choo/html');
const debounce = require('lodash.debounce');
const component = require('../utils/component');
const { __ } = require('../../locale');

const SPEED_FACTOR = 1000;

module.exports = component({
  name: 'onboarding',
  page: 0,

  onload(element, doc, onboarded) {
    let bounceScroll;
    let scrollstart = null;
    let isCaptured = false;

    const cards = doc.getGroup('onboarding.cards').toArray();

    const next = element.querySelector('.js-next');
    const reel = element.querySelector('.js-reel');
    let { offsetWidth } = reel;

    const preventScroll = (event) => {
      if (isCaptured) {
        this.debug('captured', reel.scrollLeft);
        event.preventDefault();
      }
    };

    const justify = (target) => {
      const { scrollLeft } = reel;
      let frame = target || Math.max(0, Math.ceil(scrollLeft / offsetWidth));

      if (frame < 0) {
        frame = 0;
      } else if (frame > (cards.length - 1)) {
        frame = cards.length - 1;
      }

      const offset = offsetWidth * frame;

      // Modulate between 300ms and 800ms animation
      const time = Math.max(0.3, Math.min(Math.abs(scrollLeft - offset) / SPEED_FACTOR, 0.8));

      let currentTime = 0;

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
          this.page = frame;
          isCaptured = false;
          this.update(doc, onboarded);
        }
      };

      tick();
    };

    window.addEventListener('resize', debounce(() => {
      offsetWidth = reel.offsetWidth;
    }, 200));

    window.addEventListener('wheel', preventScroll);
    reel.addEventListener('touchmove', preventScroll);

    reel.addEventListener('touchend', event => {
      if (event.touches.length) { return; }
      clearTimeout(bounceScroll);
      isCaptured = true;
      justify();
    });

    next.addEventListener('click', event => {
      if (this.page === cards.length - 1) {
        onboarded();
      } else {
        justify(this.page + 1);
      }

      event.preventDefault();
    });

    reel.addEventListener('scroll', () => {
      const { scrollLeft } = reel;

      if (isCaptured) {
        return;
      }

      if (!scrollstart) {
        scrollstart = scrollLeft;
        return;
      }

      clearTimeout(bounceScroll);

      const delta = scrollstart - scrollLeft;
      if (!isCaptured && (Math.abs(delta) > (offsetWidth / 5))) {
        justify(this.page + delta > 0 ? -1 : 1);
        this.debug('exceeded threshold')
        scrollstart = null;
        isCaptured = true;
      } else {
        bounceScroll = setTimeout(() => {
          this.debug('time')
          if (!isCaptured) {
            isCaptured = true;
            scrollstart = null;
            justify();
          }
        }, 250);
      }
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
                  <div class="u-marginTm u-marginBl u-marginHm">
                    <img class="Onboarding-image" src=${ image.url } />
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
