const html = require('choo/html');
const { __ } = require('../../locale');
const { checkmark } = require('../icons');
const { getPerformance } = require('../utils');

const TYPES = {
  electricity: 'Electricity',
  heat: 'Heating & Hot water'
};

module.exports = function form(cooperative, state, emit) {
  const consumptions = state.consumptions || {};
  const cooperatives = state.cooperatives || [];
  const { granularity, type, compare, normalized } = consumptions;
  const performance = getPerformance(cooperative);
  const disabled = consumptions.isLoading;
  const onchange = event => {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    emit(target.name, value);
  };

  const typeOptions = Object.keys(TYPES).map(key => {
    const addSuffix = key === 'electricity' && performance && performance.incHouseholdElectricity;

    return {
      value: key,
      isSelected: type === key,
      label: addSuffix ? __('Total %s (incl. households)', __('elec')) : __(TYPES[key])
    };
  });

  let compareLabel = __('Pick one');
  if (compare) {
    if (compare === 'prev_year') {
      compareLabel = __('Previous year');
    } else {
      const match = compare.match(/cooperative:(.+)/);
      const cooperative = cooperatives.find(item => item._id === match[1]);
      compareLabel = cooperative.name;
    }
  } else if (granularity === 'year') {
    compareLabel = __('Pick a cooperative');
  }

  /**
   * Using a lot of flex and margin utilities here to:
   * - Switch between row/col flex layout depending on viewport width
   * - Stretch/align elements based on viewport width
   * - Align flexed items to right edge in large viewports
   * - Have container apply margin left and each individual element margin right
   * - Have each individual element apply margin bottom
   * - Toggles have individual flex grow depending on context
   */

  return html`
    <form class="Form u-flex u-flexCol u-flexJustifyEnd u-md-flexRow u-lg-flexRow u-md-flexAlignItemsBaseline u-lg-flexAlignItemsBaseline u-paddingLb">

      <!-- Medium & large viewports: move granularity toggle to end of form -->
      <div class="u-md-flexOrderLast u-lg-flexOrderLast u-marginRb">
        <div class="Form-switchGroup u-marginBs u-sizeFull">
          <label class="Form-switch u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="month" onchange=${ onchange } checked=${ granularity === 'month' } disabled=${ disabled }/>
            <span class="Form-label">${ __('Monthly') }</span>
          </label>
          <label class="Form-switch u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="year" onchange=${ onchange } checked=${ granularity === 'year' } disabled=${ disabled } />
            <span class="Form-label">${ __('Yearly') }</span>
          </label>
        </div>

        <label class="u-flex u-marginBs u-sizeFull">
          <input class="Form-target Form-target--compex" type="checkbox" name="consumptions:normalized" onchange=${ onchange } checked=${ normalized } disabled=${ type !== 'heat' || disabled } />
          <span class="Form-pill Form-pill--leading Form-pill--checkmark u-flex u-flexAlignItemsCenter ${ disabled ? 'is-disabled' : '' }">
            ${ checkmark(14) }
          </span>
          <span class="Form-pill Form-pill--trailing u-flexGrow1 u-textNowrap ${ disabled ? 'is-disabled' : '' }">
            ${ __('Normalize') }
          </span>
        </label>
      </div>

      <!-- Medium & large viewports: break grid and flex elements horizontally -->
      <div class="u-marginRb">
        <label class="u-flex u-posRelative u-marginBs">
          <span class="Form-pill Form-pill--leading ${ disabled ? 'is-disabled' : '' }">${ __('Show') }</span>
          <span class="Form-pill Form-pill--trailing Form-pill--select u-flexGrow1 u-textNowrap ${ disabled ? 'is-disabled' : '' }">${ typeOptions.find(item => item.isSelected).label }</span>
          <select class="u-overlay" name="consumptions:type" onchange=${ onchange } disabled=${ disabled }>
            <option disabled label="${ __('Show') }"></option>
            ${ typeOptions.map(({ value, label, isSelected }) => html`
              <option value="${ value }" selected=${ isSelected }>
                ${ label }
              </option>
            `) }
          </select>
        </label>

        <label class="u-flex u-posRelative">
          <span class="Form-pill Form-pill--leading u-textNowrap ${ disabled ? 'is-disabled' : '' }">${ __('Compare with') }</span>
          <span class="Form-pill Form-pill--trailing Form-pill--select u-flexGrow1 u-textNowrap ${ disabled ? 'is-disabled' : '' }">${ compareLabel }</span>
          <select class="u-overlay" name="consumptions:compare" disabled=${ disabled } onchange=${ onchange }>
            <option disabled selected=${ !compare } label="${ __('Compare with') }"></option>
            ${ granularity === 'month' ? html`
              <option value="prev_year" selected=${ compare === 'prev_year' } disabled=${ granularity === 'year' }>
                ${ __('Previous year') }
              </option>
            ` : null }
            <optgroup label="${ __('Other cooperatives') }">
              ${ cooperatives
                  .filter(item => {
                    return item.performances.length && (item._id !== cooperative._id);
                  })
                  .map(cooperative => {
                    const value = `cooperative:${ cooperative._id }`;

                    return html`
                      <option value="${ value }" selected=${ compare === value }>
                        ${ cooperative.name }
                      </option>
                    `;
                  })
              }
            </optgroup>
          </select>
        </label>
      </div>
    </form>
  `;
};
