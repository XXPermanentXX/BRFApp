const mongoose = require('mongoose');
const _ = require('underscore');
const Schema = mongoose.Schema;
const async = require('async');
const Users = require('./users');
const { getEnergimolnetConsumption } = require('./consumption');

const CooperativeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: String,
  lat: Number,
  lng: Number,
  yearOfConst: Number,
  area: Number,
  numOfApartments: Number,
  meters: [{
    mType: String,
    useInCalc: Boolean,
    meterId: String,
  }],
  actions: [{
    name: String,
    description: String,
    date: Date,
    cost: Number,
    types: [Number],
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      comment: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  ventilationType: [String],
  performances: [{
    year: Number,
    value: Number,
    area: Number
  }],
  editors: [{
    editorId: Schema.Types.ObjectId,
    name: String,
  }],
  extraInfo: Schema.Types.Mixed
});

var Cooperative = mongoose.model('Cooperative', CooperativeSchema);

function getConsumption(cooperative, options, done) {
  const { type, granularity, from, to, normalized } = options;
  const { meters, area } = cooperative;

  getEnergimolnetConsumption(meters, type, granularity, from, to, normalized, (err, results) => {
    if (err) { return done(err); }
    done(null, results.map(value => value / (area ? area : 1)));
  });
}

function calculatePerformance(cooperative, done) {
  cooperative = cooperative.toObject();

  const year = new Date().getFullYear();
  const performance = cooperative.performances.find(perf => perf.year === year);

  if (performance) {
    cooperative.performance = performance.value;
    return done(null, cooperative);
  } else {
    const params = {
      type: 'heating',
      granularity: 'month',
      from: year - 1,
      to: null,
      normalized: false
    };

    getConsumption(cooperative, params, (err, result) => {
      if (err) { return done(err); }

      const value = result.reduce((sum, num) => sum + num, 0);

      cooperative.performance = value;
      cooperative.performances.push({ year, value, area: cooperative.area });
      Cooperative.findByIdAndUpdate(
        cooperative._id,
        { $set: { performances: cooperative.performances }},
        () => 1
      );

      done(null, cooperative);
    });
  }
}

exports.create = function(cooperative, user, done) {
  Cooperative.create({
    name: cooperative.name,
    email: cooperative.email,
    lng: cooperative.lng,
    lat: cooperative.lat,
    yearOfConst: cooperative.yearOfConst,
    area: cooperative.area,
    numOfApartments: cooperative.numOfApartments,
    meters: cooperative.meters,
    ventilationType: cooperative.ventilationType,
    editors: [ user._id ]
  }, done);
};

exports.all = function(done) {
  Cooperative.find({}, (err, cooperatives) => {
    if (err) { return done(err); }

    async.map(cooperatives, calculatePerformance, (err, coops) => {
      if (err) { return done(err); }
      done(null, coops);
    });
  });
};

exports.get = function (id, user, done) {
  Cooperative
    .findOne({ _id: id })
    .populate('actions.comments.user','profile _id')
    .exec((err, cooperative) => {
      if (err) { return done(err); }
      if (!cooperative) { return done(new Error('Cooperative not found')); }

      calculatePerformance(cooperative, done);
    });
};

exports.getProfile = function(id, user, done) {
  Cooperative.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }
    if (!cooperative) { return done(new Error('Cooperative not found')); }

    done(null, cooperative);
  });
};

exports.update = function(id, cooperative, done) {
  Cooperative.findByIdAndUpdate(id, {
    $set : {
      name: cooperative.name,
      email: cooperative.email,
      yearOfConst: cooperative.yearOfConst,
      area: cooperative.area,
      numOfApartments: cooperative.numOfApartments,
      ventilationType: cooperative.ventilationType,
    }
  }, done);
};

exports.addAction = function(id, action, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      // cooperative = cooperative.toObject();
      if (!cooperative.actions){
        cooperative.actions = [];
      }
      cooperative.actions.push(action);
      cooperative.markModified('actions');
      cooperative.save(function(err){
        if (err) { return cb(err); }
        cb(err,cooperative);
      });
    }
  });
};

exports.updateAction = function(id, actionId, newAction, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        action.name = newAction.name;
        action.date = newAction.date;
        action.description = newAction.description;
        action.cost = newAction.cost;
        action.types = newAction.types;
        cooperative.markModified('actions');
        cooperative.save(function(err){
          if (err) { return cb(err); }
          cb(err,cooperative);
        });
      }
    }
  });
};

exports.deleteAction = function(id, actionId, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        action.remove();
        cooperative.markModified('actions');
        cooperative.save(function(err){
          if (err) { return cb(err); }
          cb(err,cooperative);
        });
      }
    }
  });
};

exports.commentAction = function(id, actionId, comment, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb(new Error('Cooperative action not found'));
      } else {
        if(!action.comments){
          action.comments = [];
        }
        comment.user = user._id;
        action.comments.push(comment);
        comment = _.last(action.comments).toObject();
        cooperative.markModified('actions');
        cooperative.save(function(err){
          if (err) { return cb(err); }
          comment.user = {
            _id: user._id,
            profile: user.profile
          };
          cb(err,comment);
        });
      }
    }
  });
};

exports.getComments = function(id, actionId, user, cb) {
  Cooperative.findOne({
    _id: id
  })
  .populate('actions.comments.user', 'profile')
  .exec(function(err, cooperative) {
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb(new Error('Cooperative action not found'));
      } else {
        action = action.toObject();
        cb(null, action.comments.sort((a, b) => a.date < b.date ? 1 : -1));
      }
    }
  });
};

exports.deleteActionComment = function(id, actionId, commentId, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb(new Error('Cooperative action not found'));
      } else {
        var comment = action.comments.id(commentId);
        if(!comment) {
          cb('Comment not found');
        }
        comment.remove();
        cooperative.markModified('actions');
        cooperative.save(function(err){
          if (err) { return cb(err); }
          cb(err, cooperative);
        });
      }
    }
  });
};

exports.addEditor = function(id, editor, user, cb) {
    // find the editor name and save it as well, to avoid an extra query when listing editors
  Users.model.findOne({
    _id: editor.editorId
  }, function(err, user) {
    if (err) {
      cb(err);
    } else if (!user) {
      cb(new Error('User not found'));
    } else {
      editor.name = user.profile.name;
      Cooperative.findOne({
        _id: id
      }, function(err, cooperative) {
        if (err) {
          cb(err);
        } else if (!cooperative) {
          cb(new Error('Cooperative not found'));
        } else {
          if (!cooperative.editors) {
            cooperative.editors = [];
          }

          cooperative.editors.push(editor);
          cooperative.markModified('editors');
          cooperative.save(function(err) {
            if (err) { return cb(err); }
            cb(err, cooperative);
          });
        }
      });
    }
  });
};


exports.deleteEditor = function(id, coopEditorId, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      var editor = cooperative.editors.id(coopEditorId);
      if(!editor) {
        cb(new Error('Cooperative editor not found'));
      } else {
        editor.remove();
        cooperative.markModified('editors');
        cooperative.save(function(err){
          if (err) { return cb(err); }
          cb(err,cooperative);
        });
      }
    }
  });
};

exports.getAvgConsumption = function (type, granularity, from, to, cb) {
  Cooperative.find({}, function (err, cooperatives){
    if (err) { return cb(err); }

    async.map(cooperatives, function (cooperative, cb2) {
      getConsumption(
        cooperative,
        { type, granularity, from, to, normalized: false },
        cb2
      );
    }, function (err, coopsData) {
      if (err) { return cb(err); }

      const avg = _.chain(coopsData)
        .reject(_.isEmpty)
        .unzip()
        .map(function(data){
          return _.reduce(data,function(memo, num){
            return memo + num;
          },0)/data.length;
        })
        .value();

      cb(null, avg);
    });
  });
};

exports.addMeter = function(id, meterId, type, useInCalc, cb) {
  Cooperative.findOne({
    _id:id
  },function(err,cooperative){
    if(err) {
      cb(err);
    } else if (!cooperative){
      cb(new Error('Cooperative not found'));
    } else {
      cooperative.meters.push({
        mType:type,
        meterId: meterId,
        useInCalc: useInCalc
      });
      cooperative.markModified('meters');
      cooperative.save(function(err){
        if (err) { return cb(err); }
        cb(err,cooperative);
      });
    }
  });
};

exports.getConsumption = function(options, cb) {
  Cooperative.findOne({
    _id: options.id
  },function(err,cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb(new Error('Cooperative not found'));
    } else {
      getConsumption(cooperative, options, cb);
    }
  });
};

exports.getAll = function(cb){
  Cooperative.find({}, cb);
};


exports.model = Cooperative;
