const html = require('choo/html');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

const pages = {
  home: {
    href: state => state.user._id && resolve(`/cooperatives/${ state.user.cooperative }`),
    title: state => {
      if (!state.user._id) { return; }

      const cooperative = state.cooperatives.items.find(props => {
        return props._id === state.user.cooperative;
      });

      return cooperative.name;
    }
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
    href: state => state.user._id && resolve('/auth/signout'),
    title: () => __('Sign out')
  },
  signin: {
    href: state => !state.user._id && resolve('/auth'),
    title: () => __('Sign in')
  }
};

const extract = links => state => Object.keys(pages)
  .filter(key => links.includes(key) && pages[key].href(state))
  .map(key => ({ href: pages[key].href(state), title: pages[key].title(state) }))
  .filter(page => page.href);

exports.extract = extract;

exports.list = links => (state, prev, send) => html`
  <ul class="Menu">
    ${ (extract(links || Object.keys(pages))(state)).map(props => html`
      <li class="Menu-item">
        <a href=${ props.href } onclick=${ () => send('menu:close') } class="Menu-link">${ props.title }</a>
      </li>
    `) }
  </ul>
`;
