const html = require('choo/html');
const header = require('../components/page-head')('edit-cooperative');
const footer = require('../components/app/footer');
const { input, select, checkbox } = require('../components/form');
const component = require('../components/utils/component');
const { __ } = require('../locale');

const VENTILATION_TYPES = [ 'FTX', 'FVP', 'F', 'FT', 'S', 'UNKNOWN', 'OTHER' ];

module.exports = view;

const form = component({
  name: 'registration-form',
  props: {
    reuse: false
  },

  render(cooperative, state, emit) {
    const { registration: doc } = state;
    const url = cooperative ? `/cooperatives/${ cooperative._id }` : '/cooperatives';
    const onreuse = event => {
      this.props.reuse = event.target.checked;
      this.update(cooperative, state, emit);
    };
    const stash = event => {
      const { target } = event;
      const isBoolean = (/checkbox|radio/).test(target.type);
      this.props[event.target.name] = isBoolean ? target.checked : target.value;
      this.update(cooperative, state, emit);
    };

    const {
      name,
      numOfApartments,
      yearOfConst,
      area,
      ventilationType,
      email,
      hasLaundryRoom,
      hasGarage,
      hasCharger,
      hasEnergyProduction,
      hasRepresentative,
      hasConsumptionMapping,
      hasGoalManagement,
      hasBelysningsutmaningen,
      hasAgreed
    } = Object.assign({}, cooperative, this.props);

    const belysningsutamningen = html`
      <span>${ __('Read more about the intiative') + ' ' }
        <a href="http://www.energimyndigheten.se/belysningsutmaningen/" target="_blank">
          ${ __('Here').toLowerCase() }
        </a>
      </span>
    `;

    return html`
      <form action="${ url }" method="POST" class="Form" enctype="application/x-www-form-urlencoded" onsubmit=${ onsubmit }>
          ${ cooperative ? html`
            <input type="hidden" name="_method" value="PUT" />
          ` : html`
            <input type="hidden" name="cooperative" value=${ cooperative._id } />
          ` }

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-properties').asElement() }
          </div>

          <div class="Form-collapse u-marginVm">
            ${ input({ label: __('Name'), name: 'name', oninput: stash, required: true, value: name }) }
            ${ input({ label: __('Number of apartments'), type: 'number', name: 'numOfApartments', oninput: stash, value: numOfApartments }) }
            ${ input({ label: __('Year of construction'), type: 'number', name: 'yearOfConst', oninput: stash, max: (new Date()).getFullYear(), pattern: '[0-9]{4}', value: yearOfConst }) }
            ${ input({ label: __('Heated area'), type: 'number', name: 'area', oninput: stash, value: area }) }
            ${ select({ label: __('Ventilation type'), onchange: stash, name: 'ventilationType', children: VENTILATION_TYPES.map(type => ({
              label: __(`VENTILATION_TYPE_${ type }`),
              value: type,
              selected: ventilationType === type
            })) }) }
            ${ checkbox({ label: __('Reuse e-mail address from registration'), description: `${ __('Register using') } ${ 'trolol@foo.bar' }`, onchange: onreuse, checked: this.props.reuse }) }
            ${ input({ label: __('E-mail address of energy representative'), type: 'email', name: 'email', oninput: stash, value: email || this.reuse && state.user.email }) }
          </div>

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-utilities').asElement() }
          </div>

          <div class="Form-collapse u-marginVm">
            ${ checkbox({ label: __('Shared laundry room'), onchange: stash, name: 'hasLaundryRoom', checked: hasLaundryRoom }) }
            ${ checkbox({ label: __('Garage'), onchange: stash, name: 'hasGarage', checked: hasGarage }) }
            ${ checkbox({ label: __('Charger for electric cars'), onchange: stash, name: 'hasCharger', checked: hasCharger }) }
            ${ checkbox({ label: __('Renewable energy production'), onchange: stash, name: 'hasEnergyProduction', checked: hasEnergyProduction }) }
          </div>

          <div class="Type">
             ${ doc.getStructuredText('registration.cooperative-initiatives').asElement() }
          </div>

          <div class="Form-collapse u-marginVm">
            ${ checkbox({ label: __('Assigned energy representative'), onchange: stash, name: 'hasRepresentative', checked: hasRepresentative }) }
            ${ checkbox({ label: __('Energy consumption maping'), onchange: stash, name: 'hasConsumptionMapping', checked: hasConsumptionMapping }) }
            ${ checkbox({ label: __('Goal oriented energy management'), onchange: stash, name: 'hasGoalManagement', checked: hasGoalManagement }) }
            ${ checkbox({ label: __('Part of belysningsutmaningen'), description: belysningsutamningen, onchange: stash, name: 'hasBelysningsutmaningen', checked: hasBelysningsutmaningen }) }
          </div>

          <div class="Type">
             ${ doc.getStructuredText('registration.service-disclaimer').asElement() }
          </div>

          <div class="Form-collapse u-marginVm">
            ${ checkbox({ label: __('I agree'), onchange: stash, name: 'hasAgreed', checked: hasAgreed }) }
          </div>

          <button type="submit" class="Button u-block u-sizeFull">${ __('Save') }</button>
        </form>
    `;

    function onsubmit(event) {
      event.preventDefault();
    }
  }
});

function view(state, emit) {
  const { params: { cooperative: id }} = state;
  const cooperative = state.cooperatives.find(item => item._id === id);

  return html`
    <div class="App">
      ${ header(state, emit) }
      <div class="App-container App-container--sm">
        <div class="u-marginVm">
          ${ form(cooperative, state, emit) }
        </div>
      </div>
      ${ footer(state, emit) }
    </div>
  `;
};

view.title = state => {
  const { params: { cooperative: id }} = state;
  const cooperative = state.cooperatives.find(item => item._id === id);

  if (cooperative) {
    return `${ __('Edit') } ${ cooperative.name }`;
  }

  return __('Add cooperative');
};
