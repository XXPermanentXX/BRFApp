const html = require('choo/html');
const { __ } = require('../../locale');

const TYPES = {
  heating: 'Heating & Hot water',
  electricity: 'Electricity'
};

module.exports = function form(cooperative, state, emit) {
  const consumptions = state.consumptions || {};
  const cooperatives = state.cooperatives || [];
  const { granularity, type, compare } = consumptions;
  const disabled = consumptions.isLoading;
  const onchange = event => emit(event.target.name, event.target.value);

  return html`
    <form class="Form u-marginTm u-paddingHb u-flex u-flexCol u-flexAlignItemsStretch">
      <fieldset class="u-marginBb">
        <div class="u-flex">
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="month" onchange=${ onchange } checked=${ granularity === 'month' } disabled=${ disabled }/>
            <span class="Form-label">${ __('Montly') }</span>
          </label>
          <label class="Form-toggle u-flexGrow1">
            <input class="u-hiddenVisually" type="radio" name="consumptions:granularity" value="year" onchange=${ onchange } checked=${ granularity === 'year' } disabled=${ disabled } />
            <span class="Form-label">${ __('Yearly') }</span>
          </label>
        </div>
      </fieldset>
      <div class="Form-grid">
        <label for="form_type" class="Form-label Form-label--pill">${ __('Show') }</label>
        <select id="form_type" class="Form-select Form-select--pill u-marginBb" name="consumptions:type" onchange=${ onchange } disabled=${ disabled }>
          ${ Object.keys(TYPES).map(key => html`
              <option value=${ key } selected=${ type === key }>
                ${ __(TYPES[key]) }
              </option>
          `) }
        </select>

        <label for="form_compare" class="Form-label Form-label--pill">${ __('Compare with') }</label>
        <select id="form_compare" class="Form-select Form-select--pill" name="consumptions:compare" disabled=${ disabled } onchange=${ onchange }>
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
