/* global db, ObjectId */

db.users.find({}).forEach(function (user) {
  var profile = assign({}, user.profile, {
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

  db.cooperatives.update({ _id: cooperative._id }, {
    name: cooperative.name,
    email: cooperative.email,
    lat: cooperative.lat,
    lng: cooperative.lng,
    yearOfConst: cooperative.yearOfConst,
    area: cooperative.area,
    numOfApartments: cooperative.numOfApartments,
    ventilationType: cooperative.ventilationType,
    meters: cooperative.meters,
    performances: [],
    actions: actions,
    editors: editors
  });
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
