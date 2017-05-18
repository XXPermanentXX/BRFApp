const html = require('choo/html');
const omit = require('lodash.omit');

module.exports = function menu(links) {
  return html`
    <ul class="Menu">
      ${ links.map(props => {
        const link = html`
          <a class="Menu-link" onclick=${ props.onclick || null }>
            ${ props.title }
          </a>
        `;

        Object.keys(omit(props, 'title')).forEach(key => {
          if (!(/^on/.test(key))) {
            link.setAttribute(key, props[key]);
          }
        });

        return html`<li class="Menu-item">${ link }</li>`;
      }) }
    </ul>
  `;
};
