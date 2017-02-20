const html = require('choo/html');
const moment = require('moment');
const comment = require('./comment');
const resolve = require('../../resolve');
const { __ } = require('../../locale');

module.exports = function (props) {
  const numComments = props.comments.length;
  const href = resolve(`/cooperatives/${ props.cooperativeId }/actions/${ props._id }`);

  return html`
    <article class="Action" id="action-${ props._id }">
      <a href=${ href } class="u-linkComplex u-block">
        <time class="Action-date" datetime=${ props.date }>${ moment(props.date).format('MMM YYYY') }</time>
        <h3 class="u-linkComplexTarget Action-title">${ props.name }</h3>
      </a>
      <div class="u-marginTb">
        ${ numComments ? comment(Object.assign({ slim: true }, props.comments[0])) : null }
        <a class="u-block u-textS" href="${ href }#comments">
        ${ numComments > 1 ? __('View all %d comments', numComments) : __('Leave a comment') }
        </a>
      </div>
    </article>
  `;
};
