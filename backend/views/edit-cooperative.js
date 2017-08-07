const html = require('choo/html');
const app = require('../components/app');
const { input, checkbox, radiogroup } = require('../components/form');
const { loader } = require('../components/icons');
const component = require('../components/utils/component');
const { __ } = require('../locale');

const VENTILATION_TYPES = [ 'FTX', 'FVP', 'F', 'FT', 'S', 'OTHER' ];

module.exports = app(view, title);

const form = component({
  name: 'registration-form',
  props: {
    reuse: false,
    showMustAgree: false
  },

  render(cooperative, state, emit) {
    const doc = state.content.registration;
    const url = cooperative._id ? `/cooperatives/${ cooperative._id }` : '/cooperatives';

    const onreuse = event => {
      this.props.reuse = event.target.checked;
      this.render(cooperative, state, emit);
    };

    const stash = event => {
      const { target } = event;
      const isBoolean = (/checkbox|radio/).test(target.type);
      const cast = target.dataset.cast;
      let value = isBoolean ? target.checked : target.value;

      if (cast && value) {
        if (cast === 'number' || target.type === 'number') {
          value = parseInt(value.replace(/\s/g, ''));

          if (isNaN(value)) {
            value = '';
          }
        }
      }

      this.props[event.target.name] = value;
      this.render(cooperative, state, emit);
    };

    const onHousholdUsageChange = event => {
      let value = +event.target.value;

      if (value === 0) {
        this.props.incHouseholdElectricity = false;
      } else if (value === 1) {
        this.props.incHouseholdElectricity = true;
      } else {
        delete this.props.incHouseholdElectricity;
      }

      this.render(cooperative, state, emit);
    };

    const onsubmit = event => {
      const data = Object.assign({}, cooperative, this.props);

      if (!cooperative._id && !this.props.hasAgreed) {
        this.props.showMustAgree = true;
        this.render(cooperative, state, emit);
      } else if (cooperative) {
        emit('cooperatives:update', { cooperative, data });
      } else {
        emit('cooperatives:add', { data });
      }

      event.preventDefault();
    };

    const onclick = event => {
      const form = event.target.form;

      if (form && form.checkValidity && !form.checkValidity()) {
        emit('error', new Error(__('Some required fields need to be filled in or are malformatted')));

        if (form.reportValidity) {
          form.reportValidity();
        }

        event.preventDefault();
      } else {
        emit('error:dismiss');
      }
    };

    const props = Object.assign({
      hasLaundryRoom: false,
      hasGarage: false,
      hasCharger: false,
      hasEnergyProduction: false,
      hasRepresentative: false,
      hasConsumptionMapping: false,
      hasGoalManagement: false,
      hasBelysningsutmaningen: false,
      hasAgreed: false
    }, cooperative, this.props);

    const householdUsageOptions = [
      ['All household have individual contracts and can choose energy provider'],
      [
        'The cooperative has a contract covering all energy use',
        'Households are charged by usage or fixed ammount'
      ]
    ].map((label, index) => {
      let checked = false;
      let { incHouseholdElectricity } = props;

      if (index === 1) {
        checked = incHouseholdElectricity;
      } else if (index === 0) {
        checked = incHouseholdElectricity === false;
      }

      return {
        label: __(label[0]),
        description: label[1] ? __(label[1]) : null,
        value: index,
        checked: checked,
        name: 'incHouseholdElectricity',
        onchange: onHousholdUsageChange
      };
    });

    if (typeof cooperative.incHouseholdElectricity === 'undefined') {
      householdUsageOptions.push({
        label: __('Don\'t know'),
        checked: typeof props.incHouseholdElectricity === 'undefined',
        name: 'incHouseholdElectricity',
        onchange: onHousholdUsageChange
      });
    }

    return html`
      <form action="${ url }" method="POST" class="Form" enctype="application/x-www-form-urlencoded" onsubmit=${ onsubmit }>
        <fieldset disabled=${ state.isLoading || null }>
          ${ cooperative._id ? html`<input type="hidden" name="_method" value="PUT" />` : null }

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-properties').asElement() }
          </div>

          <div class="Form-collapse u-marginTm u-marginBg">
            ${ input({ label: __('Name'), name: 'name', oninput: stash, required: true, value: props.name }) }
            ${ input({ label: __('Number of apartments'), type: 'number', name: 'numOfApartments', oninput: stash, value: props.numOfApartments }) }
            ${ input({ label: __('Year of construction'), type: 'number', name: 'yearOfConst', oninput: stash, max: (new Date()).getFullYear(), pattern: '\\d{4}', value: props.yearOfConst }) }
            ${ input({ label: __('Heated area'), type: 'number', name: 'area', oninput: stash, required: true, 'data-cast': 'number', suffix: props.area && html`<span>m<sup>2</sup></span>`, value: props.area }) }
            ${ props.email && !cooperative._id ? checkbox({ label: __('Reuse e-mail address from registration'), description: __('Register using %s', cooperative.email), onchange: onreuse, checked: props.reuse }) : null }
            ${ input({ label: __('E-mail address of energy representative'), type: 'email', name: 'email', oninput: stash, readonly: props.reuse, value: this.props.email || ((props.reuse || cooperative._id) && cooperative.email) }) }
          </div>

          <div class="Type">
            <h2>${ __('What type of ventilation is installed?') }
              <br />
              <span class="u-textS u-colorDark">${ __('Pick one or more') }</span>
            </h2>
          </div>

          <div class="Form-collapse u-marginTm u-marginBg">
            ${ VENTILATION_TYPES.map(type => checkbox({
              label: __(`VENTILATION_TYPE_${ type }`),
              checked: props.ventilationType.includes(type),
              name: `ventilationType[][${ type }]`,
              onchange: event => {
                this.props.ventilationType = props.ventilationType || [];

                if (event.target.checked) {
                  this.props.ventilationType.push(type);
                } else {
                  const index = this.props.ventilationType.findIndex(item => item === type);
                  this.props.ventilationType.splice(index, 1);
                }

                this.render(cooperative, state, emit);
              }
            })) }
          </div>

          <div class="Type">
            <h2>${ __('How do households pay for their electricity?') }</h2>
          </div>

          <div class="Form-collapse u-marginTm u-marginBg">
            ${ radiogroup(householdUsageOptions) }
          </div>

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-utilities').asElement() }
          </div>

          <div class="Form-collapse u-marginTm u-marginBg">
            ${ checkbox({ label: __('Shared laundry room'), onchange: stash, name: 'hasLaundryRoom', checked: props.hasLaundryRoom }) }
            ${ checkbox({ label: __('Garage'), onchange: stash, name: 'hasGarage', checked: props.hasGarage }) }
            ${ checkbox({ label: __('Charger for electric cars'), onchange: stash, name: 'hasCharger', checked: props.hasCharger }) }
            ${ checkbox({ label: __('Renewable energy production'), onchange: stash, name: 'hasEnergyProduction', checked: props.hasEnergyProduction }) }
          </div>

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-initiatives').asElement() }
          </div>

          <div class="Form-collapse u-marginTm u-marginBg">
            ${ checkbox({ label: __('Assigned energy representative'), onchange: stash, name: 'hasRepresentative', checked: props.hasRepresentative }) }
            ${ checkbox({ label: __('Energy consumption mapping'), onchange: stash, name: 'hasConsumptionMapping', checked: props.hasConsumptionMapping }) }
            ${ checkbox({ label: __('Goal oriented energy management'), onchange: stash, name: 'hasGoalManagement', checked: props.hasGoalManagement }) }
            ${ checkbox({ label: __('Participating in belysningsutmaningen'), onchange: stash, name: 'hasBelysningsutmaningen', checked: props.hasBelysningsutmaningen, description: html`
              <span>${ __('Read more about the intiative') + ' ' }
                <a href="http://www.energimyndigheten.se/belysningsutmaningen/" target="_blank">
                  ${ __('Here').toLowerCase() }
                </a>
              </span>
            ` }) }
          </div>

          ${ !cooperative._id ? html`
            <div>
              <div class="Type">
                ${ doc.getStructuredText('registration.service-disclaimer').asElement() }
              </div>

              <div class="Form-collapse u-marginVm">
                ${ checkbox({ label: __('I agree'), description: props.showMustAgree && html`<span class="u-colorTomato">${ __('You must agree to the terms to continue') }</span>`, onchange: stash, name: 'hasAgreed', checked: props.hasAgreed }) }
              </div>
            </div>
          ` : null }

          <button type="submit" class="Button u-block u-sizeFull" onclick=${ onclick }>
            ${ __('Save') }
          </button>
        </fieldset>
      </form>
    `;
  }
});

function view(state, emit) {
  const { params: { cooperative: id }} = state;
  const cooperative = state.cooperatives.find(item => item._id === id);

  if (!state.content.registration) {
    emit('content:fetch', 'registration');
  }

  return html`
    <div class="App-container App-container--sm u-flexExpand">
      ${ state.content.registration ? html`
        <div class="u-marginVm">
          ${ form(cooperative, state, emit) }
        </div>
      ` : html`
        <div class="u-marginVl u-textCenter">
          ${ loader() }
        </div>
      ` }
    </div>
  `;
}

function title(state) {
  const { params: { cooperative: id }} = state;
  const cooperative = state.cooperatives.find(item => item._id === id);

  if (cooperative) {
    return `${ __('Edit') } ${ cooperative.name }`;
  }

  return __('Add cooperative');
}
