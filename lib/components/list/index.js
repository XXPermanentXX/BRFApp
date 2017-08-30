const html = require('choo/html');

exports.definition = function definition(props) {
  return html`
    <dl class="List List--definition">
      ${ Object.keys(props).reduce((list, key) => list.concat([
        html`<dt class="List-term ${ !props[key] ? 'List-term--noDefinition' : '' }">${ key }</dt>`,
        html`<dd class="List-definition">${ props[key] }</dd>`
      ]), []) }
    </dl>
  `;
};

exports.numbered = function numbered(list) {
  return html`
    <ol class="List List--numbered">
      ${ list.map((item, index) => html`
        <li class="List-item">
          <div class="List-number">${ index + 1 }</div>
          <div class="List-content">${ item }</div>
        </li>
      `) }
    </ol>
  `;
};
