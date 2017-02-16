const html = require('choo/html');

exports.defintion = function (props) {
  return html`
    <dl class="List List--definition">
      ${ Object.keys(props).reduce((list, key) => list.concat([
        html`<dt class="List-term">${ key }</dt>`,
        html`<dd class="List-definition">${ props[key] }</dd>`
      ]), []) }
    </dl>
  `;
};
