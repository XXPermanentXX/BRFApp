const html = require('choo/html');
const pick = require('lodash.pick');
const omit = require('lodash.omit');
const menu = require('../menu');
const modal = require('../modal');
const logo = require('./logo');
const { loader, chevron } = require('../icons');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

module.exports = function createHeader(view) {
  let hasModal = false;
  let isExpanded = false;

  const collapse = () => { isExpanded = false; };

  const pages = {
    home: state => state.user.isAuthenticated && ({
      href: resolve(`/cooperatives/${ state.user.cooperative }`),
      title: state.cooperatives.find(props => {
        return props._id === state.user.cooperative;
      }).name,
      onclick: collapse
    }),
    about: () => ({
      href: resolve('/about-the-project'),
      title: __('About the project'),
      onclick: collapse
    }),
    faq: () => ({
      href: resolve('/how-it-works'),
      title: __('How it works'),
      onclick: collapse
    }),
    auth: (state, emit) => ({
      href: resolve(state.user.isAuthenticated ? '/auth/signout' : '/auth'),
      onclick: (!state.user.isAuthenticated ? event => {
        hasModal = true;
        isExpanded = false;
        emit('render');

        if (!state['sign-in']) {
          emit('cms:sign-in');
        }

        event.preventDefault();
      } : null),
      'data-no-routing': true,
      title: state.user.isAuthenticated ? __('Sign out') : __('Sign in')
    })
  };

  return function render(state, emit) {
    const { user } = state;

    const toggle = open => event => {
      isExpanded = open;
      emit('render');
      event.preventDefault();
    };

    return html`
      <div id="${ view }-header" class="PageHead">
        <a href=${ resolve('/') } class="PageHead-title" onclick=${ collapse }>
          ${ logo() } Brf Energi
        </a>
        <nav class="PageHead-navigation">

          <!-- Small viewport: drop down menu list -->
          <div id="page-menu-sm" class="PageHead-menu u-md-hidden u-lg-hidden ${ isExpanded ? 'is-open' : '' }">
            ${ menu(Object.values(pages).map(page => page(state, emit))) }
          </div>

          <!-- Medium & large viewport: drop down menu list -->
          ${ user.isAuthenticated ? html`
            <div id="page-menu-lg" class="PageHead-menu u-hidden u-md-block u-lg-block ${ isExpanded ? 'is-open' : '' }">
              ${ menu(Object.values(pick(pages, 'home', 'auth')).map(page => page(state, emit))) }
            </div>
          ` : null }

          <!-- Medium & large viewport: horizontal menu list -->
          <ul class="u-hidden u-md-block u-lg-block">
            ${ Object.values(pick(pages, 'faq', 'about')).map(page => {
              const props = page(state, emit);
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
                ${ __('Menu') } ${ chevron('down') }
              </a>
            ` :
            // Render sign in link
            (function () {
              const props = pages.auth(state, emit);
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
          <a href="#page-head" data-no-routing="true" onclick=${ toggle(false) } class="PageHead-untrigger PageHead-link" hidden data-title-small=${ __('Close') } data-title-large=${ user.isAuthenticated ? __('Menu') : __('Close') }>
            ${ chevron('up') }
          </a>
        </nav>

        ${ hasModal ? modal(signin(state['sign-in'], modal.close), () => {
          hasModal = false;
          emit('render');
        }) : null }
      </div>
    `;
  };
};

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
