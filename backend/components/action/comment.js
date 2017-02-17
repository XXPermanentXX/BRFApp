const html = require('choo/html');

module.exports = function (props) {
  const classList = [ 'Action-comment' ];

  if (props.slim) {
    classList.push('Action-comment--slim');
  }

  return html`
    <div class=${ classList.join(' ') } id="comment-${ props._id }">
      <strong class="Action-author">${ props.user.profile.name }</strong> ${ props.comment }
    </div>
  `;
};
