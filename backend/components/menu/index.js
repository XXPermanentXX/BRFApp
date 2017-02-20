const html = require('choo/html');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

const pages = {
  home: {
    href: state => state.user && resolve(`/cooperatives/${ state.user.cooperativeId }`),
    title: state => state.user && state.user.cooperative.name
  },
  about: {
    href: () => resolve('/about-the-project'),
    title: () => __('About the project')
  },
  faq: {
    href: () => resolve('/how-it-works'),
    title: () => __('How it works')
  },
  signout: {
    href: state => state.user && resolve('/auth/signout'),
    title: () => __('Sign out')
  },
  signin: {
    href: state => !state.user && resolve('/auth'),
    title: () => __('Sign in')
  }
};

const extract = links => state => Object.keys(pages)
  .filter(key => links.includes(key) && pages[key].href(state))
  .map(key => ({ href: pages[key].href(state), title: pages[key].title(state) }))
  .filter(page => page.href);

exports.trigger = (state, prev, send) => () => send('menu:open', true);

exports.extract = extract;

exports.list = links => state => html`
  <ul class="Menu">
    ${ (extract(links || Object.keys(pages))(state)).map(props => html`
      <li class="Menu-item">
        <a href=${ props.href } class="Menu-link">${ props.title }</a>
      </li>
    `) }
  </ul>
`;
