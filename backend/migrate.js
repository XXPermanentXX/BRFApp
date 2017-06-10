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

db.users.find({}).forEach(user => {
  var profile = Object.assign({}, user.profile, {
    language: lang(user.profile.language)
  });
  var props = { profile: profile };

  if (user.cooperativeId) {
    props.cooperative = user.cooperativeId;
  }

  delete profile.toRehearse;

  db.users.update({ _id: user._id }, {
    $set: props,
    $unset: {
      language: '',
      actions: '',
      achievements: '',
      numFeedback: '',
      recentAchievements: '',
      cooperativeId: ''
    }
  });
});

db.actions.drop();
db.cooperatives.find({}).forEach(function (cooperative) {
  var actions = [];

  if (cooperative.actions) {
    cooperative.actions.forEach(function (action) {
      if (action instanceof ObjectId) {
        actions.push(action);
        return;
      }

      db.actions.insert({
        name: action.name,
        date: action.date,
        cost: action.cost,
        description: action.description,
        types: action.types,
        cooperative: cooperative._id,
        user: cooperative.editors[0].editorId,
        comments: action.comments.map(function (comment) {
          return {
            user: comment.user,
            author: db.users.find({ _id: ObjectId(comment.user) }).profile.name,
            comment: comment.comment,
            date: comment.date
          };
        })
      }, function (err, docs) {
        actions.push(docs[0]._id);
      });
    });
  }

  const editors = [];
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
    actions: actions,
<<<<<<< 56e3f3fa2a94d8d0b2db78db2dae4533d25e00b5
    editors: editors
  });
=======
    editors: cooperative.editors.map(props => props.editorId)
  };

  if (typeof cooperative.incHouseholdElectricity !== 'undefined') {
    props.incHouseholdElectricity = cooperative.incHouseholdElectricity;
  }

  db.cooperatives.update({ _id: cooperative._id }, props);
>>>>>>> Update migrate script to account for new properties
});

function lang(language) {
  switch(language) {
    case 'en':
    case 'English':
      return 'en';
    case 'sv':
    case 'Swedish':
    default:
      return 'sv';
  }
}

function assign() {
  var args = Array.prototype.slice.call(arguments);
  var target = args[0];

  for (var i = 1; i < args.length; i += 1) {
    if (args[i] && typeof args[i] === 'object') {
      for (var key in args[i]) {
        if (args[i].hasOwnProperty(key)) {
          target[key] = args[i][key];
        }
      }
    }
  }

  return target;
}
