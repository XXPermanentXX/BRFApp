const html = require('choo/html');
const menu = require('../menu');
const { __ } = require('../../locale');

const links = menu.extract([ 'about', 'faq' ]);

module.exports = function header(state, prev, send) {
  return html`
    <div id="page-head" class="PageHead">
      <div class="PageHead-title">BRF Energi</div>
      <nav class="PageHead-navigation">

        <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden ${ state.menu.isOpen ? 'is-open' : '' }">
          ${ menu.list()(state, prev, send) }
        </div>

        ${ state.user._id && html`
          <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block ${ state.menu.isOpen ? 'is-open' : '' }">
            ${ menu.list([ 'home', 'signout' ])(state, prev, send) }
          </div>
        ` }

        <ul class="u-hidden u-md-block u-lg-block">
          ${ links(state, prev, send).map(props => html`
            <li class="PageHead-item">
              <a href=${ props.href } class="PageHead-link">${ props.title }</a>
            </li>
          `) }
        </ul>

        <a href="#page-menu-sm" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--small PageHead-link">${ __('Menu') }</a>

        ${ state.user._id ?
          // Render user menu anchor link
          html`<a href="#page-menu-lg" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--large PageHead-link">${ state.user.profile.name }</a>` :
          // Render sign in link
          menu.extract([ 'signin' ])(state).map(props => html`<a class="PageHead-link PageHead-trigger PageHead-trigger--large" href=${ props.href}>${ props.title }</a>`)
        }

        <a href="#page-head" data-no-routing="true" onclick=${ toggle(false) } class="PageHead-untrigger PageHead-link" hidden data-title-small=${ __('Close') } data-title-large=${ state.user._id ? state.user.profile.name : __('Close') }></a>
      </nav>
    </div>
  `;

  function toggle(open) {
    return event => {
      send(`menu:${ open ? 'open' : 'close' }`);
      event.preventDefault();
    };
  }
};
