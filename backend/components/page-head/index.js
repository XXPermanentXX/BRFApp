const html = require('choo/html');
const menu = require('../menu');

const links = menu.extract([ 'about', 'faq' ]);

module.exports = function header(state, prev, send) {
  const trigger = menu.trigger(state, prev, send);

  return html`
    <div id="page-head" class="PageHead">
      <div class="PageHead-title">BRF Energi</div>
      <nav class="PageHead-navigation">

        <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden">
          ${ menu.list()(state, prev, send) }
        </div>

        ${ state.user && html`
          <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block">
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

        <a href="#page-menu-sm" class="PageHead-trigger PageHead-trigger--small PageHead-link" onclick=${ trigger }>Menu</a>

        ${ state.user ?
          // Render user menu anchor link
          html`<a href="#page-menu-lg" class="PageHead-trigger PageHead-trigger--large PageHead-link" onclick=${ trigger }>${ state.user.profile.name }</a>` :
          // Render sign in link
          menu.extract([ 'signin' ])(state).map(props => html`<a class="PageHead-link PageHead-trigger PageHead-trigger--large" href=${ props.href}>${ props.title }</a>`)
        }

        <a href="#page-head" class="PageHead-untrigger PageHead-link" hidden data-title-small="Close" data-title-large=${ state.user ? state.user.profile.name : 'Close' }></a>
      </nav>
    </div>
  `;
};
