const html = require('choo/html');

const pages = {
  home: {
    href: state => state.user && `/cooperatives/${ state.user.cooperativeId }`,
    title: state => state.user && (state.user.cooperativeId + '')//state.user.cooperative.name
  },
  about: {
    href: () => '/about',
    title: () => 'About the project'
  },
  signout: {
    href: state => state.user && '/auth/signout',
    title: () => 'Sign out'
  },
  signin: {
    href: state => !state.user && '/auth',
    title: () => 'Sign in'
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
    ${ extract(links || Object.keys(pages))(state).map(props => html`
      <li class="Menu-item">
        <a href=${ props.href } class="Menu-link">${ props.title }</a>
      </li>
    `) }
  </ul>
`;
