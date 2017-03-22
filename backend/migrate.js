/* global db, ObjectId */

db.actions.drop();

db.cooperatives
  .find({})
  .forEach(cooperative => {
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
