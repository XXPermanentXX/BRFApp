const html = require('choo/html');
const microcomponent = require('microcomponent');
const { debounce } = require('../utils');
const { __ } = require('../../locale');

const SPEED_FACTOR = 1000;

const component = microcomponent({
  name: 'onboarding',
  pure: true,
  state: {
    page: 0
  },
  props: {
    doc: null
  }
});

component.on('render', render);
component.on('load', onload);

module.exports = function onboarding(doc) {
  return component.render({ doc });
};

function onload() {
  let timeout;
  let scrollstart = null;
  let inTransition = false;

  const cards = this.props.doc.getGroup('onboarding.cards').toArray();

  const root = document.getElementById(this._element.id);
  const element = root.querySelector('.js-reel');
  let { offsetWidth } = element;

  const justify = (extra = 0) => {
    const { scrollLeft } = element;
    let frame = Math.ceil(cards.length * (scrollLeft / offsetWidth)) - 1;

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
        element.scrollLeft = scrollLeft + ((offset - scrollLeft) * factor);
      } else {
        element.scrollLeft = offset;
        inTransition = false;
        this.state.page = frame;
        this.emit('render', this.props);
      }
    };

    tick();
  };

  window.addEventListener('resize', debounce(() => {
    offsetWidth = element.offsetWidth;
  }, 200));

  element.addEventListener('scroll', () => {
    const { scrollLeft } = element;

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

  element.addEventListener('touchmove', event => {
    if (inTransition) {
      event.preventDefault();
    }
  });

  element.addEventListener('touchend', event => {
    if (event.touches.length) { return; }
    clearTimeout(timeout);
    justify();
  });
}

function render() {
  const cards = this.props.doc.getGroup('onboarding.cards').toArray();

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
            <button class="Onboarding-page ${ this.state.page === index ? 'is-active' : '' }">
              ${ card.getStructuredText('title').asText() }
            </button>
          </li>
        `) }
      </ol>

      <button class="Button u-block u-sizeFull" onclick=${ () => {} }>
        ${ __('Next') }
      </button>
    </div>
  `;
}

function easeInOut(progress) {
  return (-0.5 * (Math.cos(Math.PI * progress) - 1));
}
