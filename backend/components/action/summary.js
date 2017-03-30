const html = require('choo/html');
const moment = require('moment');
const comment = require('../comment');
const resolve = require('../../resolve');
const { __ } = require('../../locale');
const { capitalize } = require('../utils');

module.exports = function summary(action, state) {
  const numComments = action.comments.length;
  const href = resolve(`/actions/${ action._id }`);

  return html`
    <article class="Action" id="action-${ action._id }">
      <a href=${ href } class="u-linkComplex u-block">
        <time class="Action-date" datetime=${ JSON.stringify(action.date) }>
          ${ capitalize(moment(action.date).format('MMM YYYY')) }
        </time>
        <h3 class="u-linkComplexTarget Action-title">${ action.name }</h3>
      </a>
      ${ numComments ? comment(Object.assign({ short: true }, action.comments[numComments - 1]), action, state) : null }
      ${ numComments || state.user ? html`
        <a class="u-block u-textS" href="${ href }#comments-${ action._id }">
          ${ numComments ? __('View all %d comments', numComments) : __('Leave a comment') }
        </a>
      ` : null }
    </article>
  `;
};
