const html = require('choo/html');
const moment = require('moment');
const comment = require('../comment');
const resolve = require('../../resolve');
const { __ } = require('../../locale');
const { capitalize } = require('../utils');

module.exports = function (props, state) {
  const numComments = props.comments.length;
  const href = resolve(`/cooperatives/${ props.cooperativeId }/actions/${ props._id }`);
  const firstComment = props.comments[numComments - 1];

  return html`
    <article class="Action" id="action-${ props._id }">
      <a href=${ href } class="u-linkComplex u-block">
        <time class="Action-date" datetime=${ JSON.stringify(props.date) }>
          ${ capitalize(moment(props.date).format('MMM YYYY')) }
        </time>
        <h3 class="u-linkComplexTarget Action-title">${ props.name }</h3>
      </a>
      <div class="u-marginTb">
        ${ numComments ? comment(Object.assign({ short: true }, firstComment), props, state) : null }
        ${ state.user ? html`
          <a class="u-block u-textS" href="${ href }#comments-${ props._id }">
            ${ numComments > 1 ? __('View all %d comments', numComments) : __('Leave a comment') }
          </a>
        ` : null }
      </div>
    </article>
  `;
};
