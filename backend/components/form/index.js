const html = require('choo/html');
const { __ } = require('../../locale');

const RESERVED = [ 'label', 'class', 'className', 'children', 'description', 'suffix', 'unit', 'multiple' ];

exports.input = function input(props) {
  const classNames = [ 'Form-input' ].concat([ props.class, props.className ]);

  if (props.type === 'date') {
    classNames.push('Form-input--date');
  }

  return html`
    <label class="Form-item">
      <span class="Form-label">${ props.label }</span>
      ${ spread(html`<input class=${ classNames.filter(Boolean).join(' ') } />`, props) }
      ${ props.unit ? html`
        <span class="Form-unit">
          <span class="u-colorTransparent">${ props.value }</span>${ props.unit }
        </span>
      ` : null }
      ${ props.suffix ? html`<span class="Form-suffix">${ props.suffix }</span>` : null }
    </label>
  `;
};

exports.select = function select(props) {
  const tabs = [];
  const classNames = [ 'Form-select' ].concat([ props.class, props.className ]);
  const _onchange = props.onchange || function() {};

  const ondeselect = event => {
    const { currentTarget: button} = event;

    _onchange(null, selected => {
      const copy = selected.slice();
      copy.splice(copy.indexOf(button.value), 1);
      return copy;
    });

    event.preventDefault();
  };

  const attributes = Object.assign({}, props, {
    onchange(event) {
      if (props.multiple) {
        _onchange(event, selected => {
          const copy = selected.slice();
          copy.push(event.target.value);
          return copy;
        });
        event.target.value = 'none';
      } else {
        _onchange(event);
      }
    }
  });

  let children = props.children;
  if (props.multiple) {
    children = children.map(function unselect(child) {
      if (child.chilren) {
        return Object.assign({}, child, { children: child.children.map(unselect) });
      } else {
        return Object.assign({}, child, { selected: false });
      }
    });

    children.unshift({
      label: __('Pick one or more'),
      value: 'none',
      selected: true,
      disabled: true
    });
  }

  const select = spread(html`
    <select class=${ classNames.filter(Boolean).join(' ') }>
      ${ children.map(child => {
        if (child.children) {
          return html`
            <optgroup label=${ child.label }>
              ${ child.children.map(option) }
            </optgroup>
          `;
        }
        return option(child);
      }) }
    </select>
  `, attributes);

  if (props.multiple) {
    props.children.forEach(function optionAsTab(child) {
      if (child.children) {
        child.children.forEach(optionAsTab);
      } else if (child.selected) {
        tabs.push(child);
      }
    });
  }

  return html`
    <div class="Form-item Form-item--select">
      <label class="u-block u-sizeFull u-flex">
        <span class="Form-label u-clickthrough">${ props.label }</span>
        ${ select }
      </label>
      ${ tabs.map(tab => html`
        <button class="Form-tab" onclick=${ ondeselect } value=${ tab.value }>
          <span class="Form-pill Form-pill--leading Form-pill--checkmark Form-pill--outline">✖︎</span>
          <span class="Form-pill Form-pill--trailing Form-pill--outline">${ tab.label }</span>
        </button>
      `) }
    </div>
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
    <option selected=${ props.selected } value=${ props.value } disabled=${ props.disabled || false }>
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

  Object.keys(props).filter(key => (/^on/).test(key)).forEach(eventName => {
    element.addEventListener(eventName.split(/^on/)[1], props[eventName]);
  });

  return element;
}
