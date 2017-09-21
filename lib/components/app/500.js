const html = require('choo/html');
const { __ } = require('../../locale');

module.exports = function view(error) {
  return html`
    <div class="App-container App-container--md u-flexAlignContentStart">
      <h1 class="Display Display--1 u-marginTl">${ __('Oops!') }</h1>
      <div class="Text u-textCenter u-marginBl">
        <p>${ __('An unforseen error has occured. It might be temporary and you could') } <a href="">${ __('try again') }</a> ${ __('or go to') } <a href="/">${ __('the homepage') }</a>.</p>
      </div>
      ${ process.env.NODE_ENV === 'development' ? html`
        <pre class="u-sizeFull u-scroll">${ error.stack }</pre>
      ` : null }
    </div>
  `;
};
