const html = require('choo/html');
const { __ } = require('../../locale');

const TYPES = [ 'heating', 'electricity' ];
const COMPERATIVE = [ 'prev_year', 'average' ];
const STRINGS = {
  'prev_year': 'Previous year',
  'average': 'Neighborhood average',
  'heating': 'Heating & Hot water',
  'electricity': 'Electricity'
};

module.exports = function form(props, emit) {
  const { granularity, type, compare, disabled } = props;

  return html`
    <form class="Form u-marginTm u-paddingHb u-flex u-flexCol u-flexAlignItemsStretch">
      <fieldset class="u-marginBb">
        <div class="u-flex">
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="granularity" value="month" onchange=${ setGranularity } checked=${ granularity === 'month' } disabled=${ !!disabled }/>
            <span class="Form-label">${ __('Montly') }</span>
          </label>
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="granularity" value="year" onchange=${ setGranularity } checked=${ granularity === 'year' } disabled=${ !!disabled } />
            <span class="Form-label">${ __('Yearly') }</span>
          </label>
        </div>
      </fieldset>
      <div class="Form-grid">
        <label for="form_type" class="Form-label Form-label--pill">${ __('Show') }</label>
        <select id="form_type" class="Form-select Form-select--pill u-marginBb" name="type" onchange=${ setType } disabled=${ !!disabled }>
          ${ TYPES.map(value => html`
              <option value=${ value } selected=${ type === value }>
                ${ __(STRINGS[value]) }
              </option>
          `) }
        </select>

        <label for="form_compare" class="Form-label Form-label--pill">${ __('Compare with') }</label>
        <select id="form_compare" class="Form-select Form-select--pill" name="compare" disabled=${ !!disabled }>
          ${ COMPERATIVE.map(value => html`
              <option value=${ value } selected=${ compare === value }>
                ${ __(STRINGS[value]) }
              </option>
          `) }
        </select>
      </div>
    </form>
  `;

  function setType(event) {
    emit('consumptions:type', event.target.value);
  }

  function setGranularity(event) {
    emit('consumptions:granularity', event.target.value);
  }
};
