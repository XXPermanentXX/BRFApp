/* global db, ObjectId */

var MIGRATION_PATH = [{
  description: 'Slog av ström till värmeslingor terrass.',
  _id: '563a4cd616428aa25f7664b1',
  type: 54
}, {
  description: 'Minskad frekvens garageventilation.',
  _id: '563a4e3616428aa25f7664d7',
  type: 31
},
{
  description: 'Nya mätare av kall och varmvatten. Ersatte tidigare disfunktionella mätare med nya av märket Broen.',
  _id: '5643824dc79d1dc1132d81bd',
  type: 21
}, {
  description: 'Ventilation, optimering',
  contractor: 'ffeb konsult',
  _id: '564383f0c79d1dc1132d81d6',
  type: 31
}, {
  _id: '5638e38f9191667857696255',
  description: 'Installation av frånluftsvärmepump',
  type: 8
}, {
  description: 'Individuell mätning av varmvatten sattes i bruk',
  _id: '5638e434919166785769625d',
  type: 21
}, {
  description: 'Elmätning i tvättstugan dvs totala åtgången vid tvätt. Trefasmätare, egen installation.',
  _id: '5638e41c9191667857696258',
  type: 51
}, {
  _id: '56556b38d99e681e26e2298e',
  type: 27
}, {
  description: 'Energibesparing genom installation av värmepumpar',
  _id: '56cc18b2807b16de588a8598',
  type: 8
}, {
  description: 'Takisolering',
  _id: '56cc1953807b16de588a859d',
  type: 13
},
{ _id: '573ec27ff7574d0000000001', actions: [ ]},
{ _id: '57f16eaa60a4a9b50a81f89c'},
{ _id: '57f16eaa60a4a9b50a81f89d'},
{ _id: '57f16eaa60a4a9b50a81f89e', actions: [ ]}, {
  description: 'Individuell mätning tappvarmvatten',
  _id: '582dbbd97486e2f732c88543',
  type: 21
}];

var old = db.actions.find({}).toArray();

db.cooperatives.find({}).forEach(function (cooperative) {
  var actions = [];

  if (cooperative.actions) {
    cooperative.actions.forEach(function (action) {
      if (action instanceof ObjectId) {
        actions.push(action);

        for (var i = 0; i < old.length; i += 1) {
          if (old[i]._id.toString() === action) {
            old.splice(i, 1);
            break;
          }
        }

        return;
      }

      var props = assign({
        date: action.date,
        cost: action.cost,
        contractor: action.contractor,
        description: action.description,
        type: action.type,
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
      }, MIGRATION_PATH.find(function (item) {
        return item._id === (action._id + '');
      }));

      delete props._id;

      db.actions.insert(props, function (err, docs) {
        if (err) {
          throw err;
        }

        actions.push(docs[0]._id);
      });
    });

    db.cooperatives.update({ _id: cooperative._id }, { $set: { actions: actions }});
  }
});

old.forEach(function (action) {
  db.actions.remove({ _id: action._id });
});

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
