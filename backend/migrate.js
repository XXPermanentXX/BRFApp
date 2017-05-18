/* global db, ObjectId */

db.users.find({}).forEach(user => {
  const profile = Object.assign({}, user.profile, {
    language: lang(user.profile.language)
  });
  const props = { profile: profile };

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
db.cooperatives.find({}).forEach(cooperative => {
  const actions = [];

  cooperative.actions.forEach(action => {
    if (action instanceof ObjectId) {
      actions.push(action);
      return;
    }

    const doc = db.actions.insertOne({
      name: action.name,
      date: action.date,
      cost: action.cost,
      description: action.description,
      types: action.types,
      cooperative: cooperative._id,
      user: cooperative.editors[0].editorId,
      comments: action.comments.map(comment => {
        return {
          user: comment.user,
          author: db.users.find({ _id: ObjectId(comment.user) }).profile.name,
          comment: comment.comment,
          date: comment.date
        };
      })
    });

    actions.push(doc.insertedId);
  });

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
    performances: cooperative.performances,
    actions: actions,
    editors: cooperative.editors.map(props => props.editorId)
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
