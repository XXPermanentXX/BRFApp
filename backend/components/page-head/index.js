const html = require('choo/html');
const pick = require('lodash.pick');
const omit = require('lodash.omit');
const menu = require('../menu');
const modal = require('../modal');
const { loader, chevron } = require('../icons');
const component = require('../utils/component');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

module.exports = component({
  name: 'page-head',
  hasModal: false,
  isExpanded: false,
  pathname: typeof window !== 'undefined' && window.location.pathname,

  shouldUpdate(args, prev) {
    const { pathname } = window.location;
    const pathChanged = pathname !== this.pathname;
    const contentChanged = args[0]['sign-in'] !== prev[0]['sign-in'];
    const modalOpened = this.hasModal && this.isExpanded;

    this.isExpanded = !this.hasModal;

    if (pathChanged) {
      this.isExpanded = false;
      this.pathname = pathname;
    }

    return modalOpened || pathChanged || contentChanged;
  },

  render(state, emit) {
    const { user } = state;

    const pages = {
      home: state => state.user.isAuthenticated && ({
        href: resolve(`/cooperatives/${ state.user.cooperative }`),
        title: state.cooperatives.find(props => {
          return props._id === state.user.cooperative;
        }).name
      }),
      about: () => ({
        href: resolve('/about-the-project'),
        title: __('About the project')
      }),
      faq: () => ({
        href: resolve('/how-it-works'),
        title: __('How it works')
      }),
      auth: state => ({
        href: resolve(state.user.isAuthenticated ? '/auth/signout' : '/auth'),
        onclick: (!state.user.isAuthenticated ? event => {
          this.hasModal = true;
          this.update(state, emit);

          if (!state['sign-in']) {
            emit('cms:sign-in');
          }

          event.preventDefault();
        } : null),
        'data-no-routing': true,
        title: state.user.isAuthenticated ? __('Sign out') : __('Sign in')
      })
    };

    const toggle = open => event => {
      this.isExpanded = open;
      this.update(state, emit);
      event.preventDefault();
    };

    return html`
      <div id="page-head" class="PageHead">
        <a href=${ resolve('/') } class="PageHead-title">BRF Energi</a>
        <nav class="PageHead-navigation">

          <!-- Small viewport: drop down menu list -->
          <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden ${ this.isExpanded ? 'is-open' : '' }">
            ${ menu(Object.values(pages).map(page => page(state))) }
          </div>

          <!-- Medium & large viewport: drop down menu list -->
          ${ user.isAuthenticated ? html`
            <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block ${ this.isExpanded ? 'is-open' : '' }">
              ${ menu(Object.values(pick(pages, 'home', 'auth')).map(page => page(state))) }
            </div>
          ` : null }

          <!-- Medium & large viewport: horizontal menu list -->
          <ul class="u-hidden u-md-block u-lg-block">
            ${ Object.values(pick(pages, 'faq', 'about')).map(page => {
              const props = page(state);
              return html`
                <li class="PageHead-item">
                  <a href=${ props.href } class="PageHead-link">${ props.title }</a>
                </li>
              `;
            }) }
          </ul>

          <!-- Small viewport: open drop down menu -->
          <a href="#page-menu-sm" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--small PageHead-link">
            ${ __('Menu') } ${ chevron('down') }
          </a>

          <!-- Medium & large viewport: open drop down menu -->
          ${ user.isAuthenticated ?
            // Render user menu anchor link
            html`
              <a href="#page-menu-lg" data-no-routing="true" onclick=${ toggle(true) } class="PageHead-trigger PageHead-trigger--large PageHead-link">
                ${ user.profile.name } ${ chevron('down') }
              </a>
            ` :
            // Render sign in link
            (function () {
              const props = pages.auth(state);
              const link =  html`
                <a class="PageHead-link PageHead-trigger PageHead-trigger--large" onclick=${ props.onclick || null }>
                  ${ props.title }
                </a>
              `;

              Object.keys(omit(props, 'title')).forEach(key => {
                if (!(/^on/.test(key))) {
                  link.setAttribute(key, props[key]);
                }
              });

              return link;
            }())
          }

          <!-- All viewports: close drop down menu -->
          <a href="#page-head" data-no-routing="true" onclick=${ toggle(false) } class="PageHead-untrigger PageHead-link" hidden data-title-small=${ __('Close') } data-title-large=${ user.isAuthenticated ? user.profile.name : __('Close') }>
            ${ chevron('up') }
          </a>
        </nav>

        ${ this.hasModal ? modal(signin(state['sign-in'], modal.close), () => {
          this.hasModal = false;
          this.update(state, emit);
        }) : null }
      </div>
    `;
  }
});

function signin(doc, onclick) {
  if (doc) {
    return html`
      <div class="u-flex u-flexCol u-flexJustifyBetween u-sizeFullV">
        <div class="u-flexShrink0 u-marginVl u-marginHm">
          <h1 class="Display Display--2 u-textCenter">
            ${ doc.getStructuredText('sign-in.title').asText() }
          </h1>
          <div class="Type">
            ${ doc.getStructuredText('sign-in.body').asElement() }
          </div>
        </div>
        <div class="u-flex">
          <a href=${ resolve('/auth/sign-up') } class="Button Button--secondary u-flexGrow1 u-flexShrink0" onclick=${ onclick }>
            ${ __('I don\'t have an account') }
          </a>
          <a href=${ resolve('/auth/metry') } data-no-routing class="Button Button  u-flexGrow1 u-flexShrink0">
            ${ __('Sign in with Metry') }
          </a>
        </div>
      </div>
    `;
  } else {
    return html`
      <div class="u-marginVl u-textCenter">
        ${ loader() }
      </div>
    `;
  }
}
