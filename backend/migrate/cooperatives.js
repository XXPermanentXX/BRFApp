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
  var meters = [];
  var ventilationType = [];

  if (cooperative.ventilationType) {
    cooperative.ventilationType.forEach(function (type) {
      ventilationType.push(VENTILATION_TYPE_MAP[type] || 'OTHER');
    });
  }

  if (cooperative.editors) {
    cooperative.editors.filter(Boolean).forEach(function (editor) {
      editors.push(editor.editorId || editor);
    });
  }

  if (cooperative.meters) {
    cooperative.meters.forEach(function (meter) {
      meters.push({
        meterId: meter.meterId,
        type: getMeterType(meter.mType)
      });
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
    ventilationType: ventilationType,
    hasLaundryRoom: cooperative.hasLaundryRoom || false,
    hasGarage: cooperative.hasGarage || false,
    hasCharger: cooperative.hasCharger || false,
    hasEnergyProduction: cooperative.hasEnergyProduction || false,
    hasRepresentative: cooperative.hasRepresentative || false,
    hasConsumptionMapping: cooperative.hasConsumptionMapping || false,
    hasGoalManagement: cooperative.hasGoalManagement || false,
    hasBelysningsutmaningen: cooperative.hasBelysningsutmaningen || false,
    meters: meters,
    performances: [],
    actions: cooperative.actions || [],
    editors: editors,
    needUpdate: true
  };

  if (typeof cooperative.needUpdate !== 'undefined') {
    props.needUpdate = cooperative.needUpdate;
  }

  if (typeof cooperative.incHouseholdElectricity !== 'undefined') {
    props.incHouseholdElectricity = cooperative.incHouseholdElectricity;
  }

  db.cooperatives.update({ _id: cooperative._id }, props);
});

function getMeterType(type) {
  switch (type) {
    case 'heating': return 'heat';
    case 'electricity': return 'electricity';
    default: return type;
  }
}
