const html = require('choo/html');

const RESERVED = [ 'label', 'class', 'className', 'children', 'description' ];

exports.input = function input(props) {
  const classNames = [ 'Form-input' ].concat([ props.class, props.className ]);

  if (props.type === 'date') {
    classNames.push('Form-input--date');
  }

  return html`
    <label class="Form-item">
      <span class="Form-label">${ props.label }</span>
      ${ spread(html`<input class=${ classNames.filter(Boolean).join(' ') } />`, props) }
    </label>
  `;
};

exports.select = function select(props) {
  const classNames = [ 'Form-select' ].concat([ props.class, props.className ]);

  if (props.multiple) {
    classNames.push('Form-select--multiple');
  }

  return html`
    <label class="Form-item Form-item--select">
      <span class="Form-label u-clickthrough">${ props.label }</span>
      ${ spread(html`
        <select class=${ classNames.filter(Boolean).join(' ') }>
          ${ props.children.map(child => {
            if (child.children) {
              return html`
                <optgroup label=${ child.label }>
                  ${ child.children.map(option) }
                </optgroup>
              `;
            }
            return option(child);
          })}
        </select>
      `, props) }
    </label>
  `;
};

exports.checkbox = function checkbox(props) {
  const classNames = [ 'Form-checkbox' ].concat([ props.class, props.className ]);

  const element =  html`
    <label class="Form-item Form-item--checkbox">
      <span class="u-flexGrow1">
        <span class="Form-label Form-label--lg">${ props.label }</span>
        ${ props.description ? html`<span class="Form-label u-colorDark">${ props.description }</span>` : null }
      </span>
      ${ spread(html`<input type="checkbox" class=${ classNames.filter(Boolean).join(' ') } />`, props) }
      <span class="Form-proxy Form-proxy--checkbox"></span>
    </label>
  `;

  element.addEventListener('selectstart', event => event.preventDefault());

  return element;
};

function option(props) {
  return html`
    <option selected=${ props.selected } value=${ props.value }>
      ${ props.label }
    </option>
  `;
}

function spread(element, props) {
  Object.keys(props)
    .filter(key => !RESERVED.includes(key) && !(/^on/.test(key)))
    .forEach(key => {
      const isBool = typeof props[key] === 'boolean';
      if ((!isBool || props[key]) && typeof props[key] !== 'undefined') {
        element.setAttribute(key, isBool ? '' : props[key].toString());
      }
    });

  Object.keys(props).filter(key => /^on/.test(key)).forEach(eventName => {
    element.addEventListener(eventName.split(/^on/)[1], props[eventName]);
  });

  return element;
}
