const html = require('choo/html');
const raw = require('choo/html/raw');
const { className } = require('../utils');
const { __ } = require('../../locale');

const RESERVED = [
  'label',
  'className',
  'children',
  'description',
  'suffix',
  'unit',
  'multiple'
];

exports.input = function input(props) {
  const attributes = Object.assign({}, props, {
    class: className([ 'Form-input', props.class, props.className ].join(' '), {
      'Form-input--date': props.type === 'date' || props.type === 'month'
    })
  });

  return html`
    <label class="Form-item ${ props.required ? 'Form-item--required' : '' }">
      <span class="Form-label Form-label--sup" title="${ props.required ? __('This field is required') : null }">${ props.label }</span>
      ${ spread(html`<input />`, attributes) }
      ${ props.unit ? html`
        <span class="Form-unit">
          <span class="u-colorTransparent">${ props.value }</span>${ props.unit }
        </span>
      ` : null }
      ${ props.suffix ? html`<span class="Form-suffix">${ props.suffix }</span>` : null }
    </label>
  `;
};

exports.textarea = function textarea(props) {
  const classNames = [ 'Form-input', 'Form-input--textarea' ].concat([ props.class, props.className ]);
  const value = props.value;
  const attributes = Object.assign({}, props, {
    class: classNames.filter(Boolean).join(' ')
  });

  delete attributes.value;

  return html`
    <label class="Form-item ${ props.required ? 'Form-item--required' : '' }">
      <span class="Form-label Form-label--sup" title="${ props.required ? __('This field is required') : null }">${ props.label }</span>
      ${ spread(html`<textarea>${ value }</textarea>`, attributes) }
    </label>
  `;
};

exports.select = function (props) {
  const classNames = [ 'Form-select' ].concat([ props.class, props.className ]);

  const attributes = Object.assign({}, props, {
    class: classNames.filter(Boolean).join(' '),
    title: props.required ? __('This field is required') : null
  });

  return html`
    <div class="Form-item Form-item--select ${ props.required ? 'Form-item--required' : '' }">
      <label class="u-block u-sizeFull u-flex">
        <span class="Form-label Form-label--sup u-clickthrough">${ props.label }</span>
        ${ spread(html`<select>${ props.children }</select>`, attributes)}
      </label>
    </div>
  `;
};

exports.checkbox = function checkbox(props) {
  const classNames = [ 'Form-toggle' ].concat([ props.class, props.className ]);

  const attributes = Object.assign({}, props, {
    class: classNames.filter(Boolean).join(' ')
  });

  return html`
    <label class="Form-item Form-item--toggle ${ props.required ? 'Form-item--required' : '' }" onselectstart=${ event => event.preventDefault() }>
      <span class="u-flexGrow1">
        <span class="Form-label Form-label--lg" title="${ props.required ? __('This field is required') : null }">${ props.label }</span>
        ${ props.description ? html`<span class="Form-label Form-label--description u-colorDark">${ props.description }</span>` : null }
      </span>
      ${ spread(html`<input type="checkbox" />`, attributes) }
      <span class="Form-proxy Form-proxy--checkbox"></span>
    </label>
  `;
};

exports.radiogroup = function radiogroup(options) {
  return options.map(option => {
    const classNames = [ 'Form-toggle' ].concat([ option.class, option.className ]);

    const attributes = Object.assign({}, option, {
      class: classNames.filter(Boolean).join(' ')
    });

    return html`
      <label class="Form-item Form-item--toggle" onselectstart=${ event => event.preventDefault() }>
        <span class="u-flexGrow1">
          <span class="Form-label Form-label--lg">${ option.label }</span>
          ${ option.description ? html`<span class="Form-label Form-label--description u-colorDark">${ option.description }</span>` : null }
        </span>
        ${ spread(html`<input type="radio" />`, attributes) }
        <span class="Form-proxy Form-proxy--radio"></span>
      </label>
    `;
  });
};

function spread(element, props) {
  const attributes = [];

  Object.keys(props)
    .filter(key => !RESERVED.includes(key) && !(/^on/.test(key)))
    .forEach(key => {
      const isBool = typeof props[key] === 'boolean';
      const isNull = props[key] === null;
      const isUndefined = typeof props[key] === 'undefined';

      if ((!isBool || props[key]) && !isUndefined && !isNull) {
        const value = isBool ? key : props[key].toString();

        if (typeof window === 'undefined') {
          attributes.push([ key, value ]);
        } else {
          element.setAttribute(key, value);
        }
      }
    });

  if (typeof window === 'undefined') {
    // Hack(ish): Interpolate attributes on raw html string
    return raw(element.replace(
      /(\s?\/>)$|.(?=>)/,
      ` ${ attributes.reduce((str, attr) => `${ str } ${ attr[0] }="${ attr[1] }"`, '') }$1`
    ));
  }

  Object.keys(props).filter(key => (/^on/).test(key)).forEach(eventName => {
    element.addEventListener(eventName.split(/^on/)[1], props[eventName]);
  });

  return element;
}
