/* global db, ObjectId */

const VENTILATION_TYPE_MAP = {
  'FTX (mekanisk från- och tilluft med återvinning)': 'FTX',
  'FVP (frånluftsvärmepump)': 'FVP',
  'F (mekanisk frånluftsventilation)': 'F',
  'FT (mekanisk från- och tilluftsventilation)': 'FT',
  'S (självdragsventilation)': 'S',
  'Vet ej': 'UNKNOWN',
  'Annat': 'OTHER'
};

db.cooperatives.find({}).forEach(cooperative => {
  var editors = [];

  if (cooperative.editors) {
    cooperative.editors.filter(Boolean).forEach(function (editor) {
      editors.push(editor.editorId);
    });
  }

  const props = {
    name: cooperative.name,
    email: cooperative.email,
    lat: cooperative.lat,
    lng: cooperative.lng,
    yearOfConst: cooperative.yearOfConst,
    area: cooperative.area,
    numOfApartments: cooperative.numOfApartments,
    ventilationType: cooperative.ventilationType.map(type => {
      return VENTILATION_TYPE_MAP[type] || 'OTHER';
    }),
    hasLaundryRoom: cooperative.hasLaundryRoom || false,
    hasGarage: cooperative.hasGarage || false,
    hasCharger: cooperative.hasCharger || false,
    hasEnergyProduction: cooperative.hasEnergyProduction || false,
    hasRepresentative: cooperative.hasRepresentative || false,
    hasConsumptionMapping: cooperative.hasConsumptionMapping || false,
    hasGoalManagement: cooperative.hasGoalManagement || false,
    hasBelysningsutmaningen: cooperative.hasBelysningsutmaningen || false,
    meters: cooperative.meters,
    performances: [],
    actions: cooperative.actions || [],
    editors: editors
  };

  if (typeof cooperative.incHouseholdElectricity !== 'undefined') {
    props.incHouseholdElectricity = cooperative.incHouseholdElectricity;
  }

  db.cooperatives.update({ _id: cooperative._id }, props);
});
