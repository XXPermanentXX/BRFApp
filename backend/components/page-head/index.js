const html = require('choo/html');
const menu = require('../menu');
const { chevron } = require('../icons');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

const links = menu.extract([ 'about', 'faq' ]);

module.exports = function header(state, emit) {
  const { user } = state;

  return html`
    <div id="page-head" class="PageHead">
      <a href=${ resolve('/') } class="PageHead-title">BRF Energi</a>
      <nav class="PageHead-navigation">

        <!-- Small viewport: drop down menu list -->
        <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden ${ state.isMenuOpen ? 'is-open' : '' }">
          ${ menu.list()(state, emit) }
        </div>

        <!-- Medium & large viewport: drop down menu list -->
        ${ user.isAuthenticated ? html`
          <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block ${ state.isMenuOpen ? 'is-open' : '' }">
            ${ menu.list([ 'home', 'signout' ])(state, emit) }
          </div>
        ` : null }

        <!-- Medium & large viewport: horizontal menu list -->
        <ul class="u-hidden u-md-block u-lg-block">
          ${ links(state, emit).map(props => html`
            <li class="PageHead-item">
              <a href=${ props.href } class="PageHead-link">${ props.title }</a>
            </li>
          `) }
        </ul>

        <!-- Small viewport: open drop down menu -->
        <a href="#page-menu-sm" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--small PageHead-link">
          ${ __('Menu') } ${ chevron('down') }
        </a>

        <!-- Medium & large viewport: open drop down menu -->
        ${ user.isAuthenticated ?
          // Render user menu anchor link
          html`<a href="#page-menu-lg" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--large PageHead-link">${ user.profile.name }</a>` :
          // Render sign in link
          menu.extract([ 'signin' ])(state).map(props => html`<a class="PageHead-link PageHead-trigger PageHead-trigger--large" href=${ props.href}>${ props.title }</a>`)
        }

        <!-- All viewports: close drop down menu -->
        <a href="#page-head" data-no-routing="true" onclick=${ toggle(false) } class="PageHead-untrigger PageHead-link" hidden data-title-small=${ __('Close') } data-title-large=${ user.isAuthenticated ? user.profile.name : __('Close') }>
          ${ chevron('up') }
        </a>
      </nav>
    </div>
  `;

  function toggle(open) {
    return event => {
      emit(`menu:${ open ? 'open' : 'close' }`);
      event.preventDefault();
    };
  }
};
