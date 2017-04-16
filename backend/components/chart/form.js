const html = require('choo/html');
const { __ } = require('../../locale');
const { checkmark } = require('../icons');

const TYPES = {
  heating: 'Heating & Hot water',
  electricity: 'Electricity'
};

module.exports = function form(cooperative, state, emit) {
  const consumptions = state.consumptions || {};
  const cooperatives = state.cooperatives || [];
  const { granularity, type, compare, normalize } = consumptions;
  const disabled = consumptions.isLoading;
  const onchange = event => {
    const { target: el } = event;
    const value = (/radio|checkbox/).test(el.type) ? el.checked : el.value;
    emit(el.name, value);
  };

  /**
   * Using a lot of flex magic to make this happen. Container toggles
   * between col/row flex layout. See comments for specifics.
   */

  return html`
    <form class="Form u-flex u-flexCol u-flexWrap u-md-flexRow u-lg-flexRow u-flexJustifyEnd">

      <!-- Medium & large viewports: move granularity toggle to end of form -->
      <div class="u-md-flexOrderLast u-lg-flexOrderLast">
        <div class="Form-toggleGroup u-marginBs">
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="month" onchange=${ onchange } checked=${ granularity === 'month' } disabled=${ disabled }/>
            <span class="Form-label">${ __('Montly') }</span>
          </label>
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="year" onchange=${ onchange } checked=${ granularity === 'year' } disabled=${ disabled } />
            <span class="Form-label">${ __('Yearly') }</span>
          </label>
        </div>

        <label class="u-flex u-marginBs">
          <input class="u-hiddenVisually" type="checkbox" name="consumptions:normalize" onchange=${ onchange } checked=${ normalize } />
          <span class="Form-pill Form-pill--leading Form-pill--checkmark u-flex u-flexAlignItemsCenter">
            ${ checkmark(14) }
          </span>
          <span class="Form-pill Form-pill--trailing u-flexGrow1">
            ${ __('Normalize') }
          </span>
        </label>
      </div>

      <!-- Medium & Large viewports: break grid and flex elements horizontally -->
      <div class="Form-grid u-md-flex u-lg-flex u-flexWrap">
        <label for="form_type" class="Form-pill Form-pill--leading">${ __('Show') }</label>
        <select id="form_type" class="Form-pill Form-pill--trailing Form-pill--select" name="consumptions:type" onchange=${ onchange } disabled=${ disabled }>
          ${ Object.keys(TYPES).map(key => html`
              <option value=${ key } selected=${ type === key }>
                ${ __(TYPES[key]) }
              </option>
          `) }
        </select>

        <label for="form_compare" class="Form-pill Form-pill--leading">${ __('Compare with') }</label>
        <select id="form_compare" class="Form-pill Form-pill--trailing Form-pill--select" name="consumptions:compare" disabled=${ disabled } onchange=${ onchange }>
          ${ !compare ? html`<option selected disabled>${ __('Pick one') }</option>` : null }
          <option value="prev_year" selected=${ compare === 'prev_year' } disabled=${ granularity === 'year' }>
            ${ __('Previous year') }
          </option>
          <optgroup label=${ __('Other cooperatives') }>
            ${ cooperatives
                .filter(item => item._id !== cooperative._id)
                .map(cooperative => {
                  const value = `cooperative:${ cooperative._id }`;

                  return html`
                    <option value=${ value } selected=${ compare === value }>
                      ${ cooperative.name }
                    </option>
                  `;
                })
            }
          </optgroup>
        </select>
      </div>
    </form>
  `;
};
