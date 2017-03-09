const html = require('choo/html');
const moment = require('moment');
const { __ } = require('../../locale');

const SHORT_LENGTH = 50;

module.exports = function (props, action, state) {
  const classList = [ 'Comment' ];
  const { user } = state;
  let content = props.comment;
  const isAuthor = user && (user._id === props.user);

  if (props.short) {
    classList.push('Comment--slim');

    if (content.length > SHORT_LENGTH) {
      content = `${ content.substr(0, SHORT_LENGTH) }…`;
    }
  }

  return html`
    <div class=${ classList.join(' ') } id="comment-${ props._id }">
      ${ props.short ? null : html`
        <time class="Comment-date" datetime=${ JSON.stringify(props.data) }>
          ${ moment(props.date).fromNow() }
        </time>
      ` }
      <strong class="Comment-author">${ props.author }</strong>
      ${ props.short ? content : html`<div class="Comment-body">${ content }</div>` }
      ${ !props.short && isAuthor ? form() : null }
    </div>
  `;

  function form() {
    return html`
      <form action="${ action._id }/comments/${ props._id }" method="POST" class="Form" enctype="application/x-www-form-urlencoded">
        <input type="hidden" name="_method" value="DELETE">
        <button type="submit" class="Comment-delete">${ __('Delete') }</button>
      </form>
    `;
  }
};
