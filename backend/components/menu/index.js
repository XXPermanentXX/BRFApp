const html = require('choo/html');
const omit = require('lodash.omit');

module.exports = function menu(links) {
  return html`
    <ul class="Menu">
      ${ links.map(props => html`
        <li class="Menu-item">
          <a ${ omit(props, 'title') } class="Menu-link">${ props.title }</a>
        </li>
      `) }
    </ul>
  `;
};
