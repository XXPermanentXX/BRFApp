/* global db, ObjectId */

var addedActions = [];

db.cooperatives.find({}).forEach(function (cooperative) {
  var actions = [];

  if (cooperative.actions) {
    cooperative.actions.forEach(function (action) {
      if (action instanceof ObjectId) {
        addedActions.push(action);
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
        addedActions.push(docs[0]._id);
        actions.push(docs[0]._id);
      });
    });

    db.cooperatives.update({ _id: cooperative._id }, { $set: { actions: actions }});
  }
});

db.actions.find({}).forEach(function (action) {
  var isNew = false;

  addedActions.forEach(function (id) {
    isNew = (isNew || id === action._id);
  });

  if (!isNew) {
    db.actions.remove({ _id: action._id });
  }
});
