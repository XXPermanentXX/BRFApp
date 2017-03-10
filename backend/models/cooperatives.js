'use strict';

var mongoose = require('mongoose');
const moment = require('moment');
var _ = require('underscore');
var Schema = mongoose.Schema;
var async = require('async');
var Consumption = require('./consumption');

var CooperativeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  email: String,
  lat: Number,
  lng: Number,
  yearOfConst: {
    type: Number,
    required: true
  },
  area: {
    type: Number,
    required: true,
  },
  numOfApartments: Number,
  meters: [{
    mType: String,
    useInCalc: Boolean,
    meterId: String,
  }],
  hasHoushouldData: Boolean,
  actions: [{
    name: String,
    description: String,
    date: Date,
    cost: Number,
    types: [Number],
    comments: [{
      user: {
        type: Schema.Types.ObjectId,
        // required: true, // TODO: causes strange error
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
  performances: [
    new Schema({
      year: Number,
      month: Number,
      value: Number,
      area: Number
    })
  ],
  editors: [{
    editorId: Schema.Types.ObjectId,
    name: String,
  }],
  extraInfo: Schema.Types.Mixed
});

var Cooperative = mongoose.model('Cooperative', CooperativeSchema);

var getConsumption = function(cooperative, type, granularity, from, to,normalized, cb) {
  if(cooperative.constructor.name == 'model') {
    cooperative = cooperative.toObject();
  }
  Consumption.getEnergimolnetConsumption(cooperative.meters,type, granularity, from, to, normalized, function(err, results){
    results = _.map(results, function(value){
      return value / (cooperative.area ? cooperative.area : 1);
    });
    cb(null,results);
  });
};

function calculatePerformance(cooperative, done) {
  const props = cooperative.toObject();

  const now = new Date();

  let performance = cooperative.performances.find(match(now));
  if (!performance) {
    performance = cooperative.performances.find(
      match(moment(now).subtract(1, 'months').toDate())
    );
  }

  if (performance) {
    props.performance = performance.value;
    return done(null, props);
  } else {
    // Get the last 13 months to ensure 12 actual values
    // since the current month may not have any value yet
    const from = moment(now).subtract(12, 'months').format('YYYYMM');
    const to = moment(now).format('YYYYMM');

    getConsumption(props, 'heating', 'month', from, to, true, (err, result) => {
      if (err) { return done(err); }

      const value = result
        // Remove any empty values (i.e. current month)
        .filter(Boolean)
        // Take the last 12 (last year)
        .slice(-12)
        // Summarize consumtion
        .reduce((memo,num) => memo + num, 0);

      props.performance = value;

      if (!value) {
        return done(null, props);
      }

      // Figure out whether the last month is missing
      const missing = result[result.length - 1] ? 0 : 1;

      cooperative.performances.push({
        year: now.getFullYear(),
        month: moment(now).subtract(missing, 'months').month(),
        area: cooperative.area,
        value: value
      });

      cooperative.save(err => {
        if (err) { return done(err); }
        done(null, props);
      });
    });
  }

  /**
   * Create an iterator function that matches given date with
   * year and month of iteratiee properties
   * @param  {Date} date Date to match against
   * @return {function}      Iterator function
   */

  function match(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    return props => props.year === year && props.month === month;
  }
}

exports.create = function(cooperative, cb) {
  Cooperative.create({
    name: cooperative.name,
    email: cooperative.email,
    lng: cooperative.lng,
    lat: cooperative.lat,
    yearOfConst: cooperative.yearOfConst,
    area: cooperative.area,
    numOfApartments: cooperative.numOfApartments,
    meters: cooperative.meters,
    ventilationType: cooperative.ventilationType
  }, cb);
};

exports.all = function(cb) {
  Cooperative.find({},function(err,cooperatives){
    if (err) {
      cb(err);
    } else {
      async.map(cooperatives,calculatePerformance,function(err,coops){
        if(err){
          cb(err);
        } else {
          cb(null,coops);
        }
      });
    }
  });
};

exports.get = function(id, user, cb) {
  Cooperative.findOne({
    _id: id
  })
  .populate('actions.comments.user','profile _id')
  .exec(function(err, cooperative) {
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb('Cooperative not found');
    } else {
      // cooperative = cooperative.toObject();
      calculatePerformance(cooperative,function(err,cooperative) {
        _.each(cooperative.actions,function(action){
          action.commentsCount = action.comments.length;
          action.comments = _.chain(action.comments)
          .sortBy(function(comment){
            return comment.date;
          })
          .reverse()
          .first(2);
        });
        cb(null, cooperative);
      });
    }
  });
};

exports.getProfile = function(id, user, cb) {
  Cooperative.findOne({
    _id: id
  })
  .exec(function(err, cooperative) {
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb('Cooperative not found');
    } else {
      cb(null, cooperative);
    }
  });
};

exports.update = function(id, data, done) {
  Cooperative.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }

    const areaChanged = data.area && (cooperative.area !== data.area);

    // Assign all data to cooperative
    Object.assign(cooperative, data);

    if (areaChanged) {
      // Remove last perfomance calculation if area has changed
      cooperative.performances.$pop();

      // Recalculate latest performance
      calculatePerformance(cooperative, err => {
        if (err) { return done(err); }
        done(null, cooperative);
      });
    } else {
      cooperative.save(done);
    }
  });
};

exports.addAction = function(id, action, user, cb) {
  Cooperative.findOne({
    _id: id
  }, function(err, cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb('Cooperative not found');
    } else {
      // cooperative = cooperative.toObject();
      if (!cooperative.actions){
        cooperative.actions = [];
      }
      cooperative.actions.push(action);
      cooperative.markModified('actions');
      cooperative.save(function(err){
        cb(err,cooperative);
      });
      // cb(null, cooperative);
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
      cb('Cooperative not found');
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
      cb('Cooperative not found');
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        action.remove();
        cooperative.markModified('actions');
        cooperative.save(function(err){
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
      cb('Cooperative not found');
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        if(!action.comments){
          action.comments = [];
        }
        comment.user = user._id;
        action.comments.push(comment);
        comment = _.last(action.comments).toObject();
        cooperative.markModified('actions');
        cooperative.save(function(err){
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

exports.getMoreComments = function(id, actionId, lastCommentId, user, cb) {
  Cooperative.findOne({
    _id: id
  })
  .populate('actions.comments.user','profile')
  .exec(function(err, cooperative) {
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb('Cooperative not found');
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        action = action.toObject();
        action.comments = _.chain(action.comments)
        .sortBy(function(comment){
          return comment.date;
        })
        .reverse()
        .value();
        var currentLastIndex = _.findIndex(action.comments,function(comment){
          return comment._id == lastCommentId;
        });
        cb(null, _.last(action.comments,action.comments.length - currentLastIndex - 1));
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
      cb('Cooperative not found');
    } else {
      var action = cooperative.actions.id(actionId);
      if(!action) {
        cb('Cooperative action not found');
      } else {
        var comment = action.comments.id(commentId);
        if(!comment) {
          cb('Comment not found');
        }
        comment.remove();
        cooperative.markModified('actions');
        cooperative.save(function(err){
          cb(err);
        });
      }
    }
  });
};

exports.addEditor = function(id, editor, user, cb) {
  // find the editor name and save it as well, to avoid an extra query when listing editors
  require('../models').users.model.findOne({
    _id:editor.editorId
  }, function(err,user){
    if (err) {
      cb(err);
    } else if (!user) {
      cb('User not found');
    } else {
      editor.name=user.profile.name;
      Cooperative.findOne({
        _id: id
      }, function(err, cooperative){
        if (err) {
          cb(err);
        } else if (!cooperative) {
          cb('Cooperative not found');
        } else {
          if (!cooperative.editors){
            cooperative.editors = [];
          }

          cooperative.editors.push(editor);
          cooperative.markModified('editors');
          cooperative.save(function(err){
            cb(err,cooperative);
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
      cb('Cooperative not found');
    } else {
      var editor = cooperative.editors.id(coopEditorId);
      if(!editor) {
        cb('Cooperative editor not found');
      } else {
        editor.remove();
        cooperative.markModified('editors');
        cooperative.save(function(err){
          cb(err,cooperative);
        });
      }
    }
  });
};

exports.getAvgConsumption = function(type, granularity, from, to, cb) {
  Cooperative.find({},function(err,cooperatives){
    async.map(cooperatives,function(cooperative,cb2){
      getConsumption(cooperative, type, granularity, from, to, false, cb2);
    },function(err,coopsData){
      var avg = _.chain(coopsData)
      .reject(_.isEmpty)
      .unzip()
      .map(function(data){
        return _.reduce(data,function(memo, num){
          return memo + num;
        },0)/data.length;
      })
      .value();
      cb(null,avg);
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
      cb('Cooperative not found');
    } else {
      cooperative.meters.push({
        mType:type,
        meterId: meterId,
        useInCalc: useInCalc
      });
      cooperative.markModified('meters');
      cooperative.save(function(err){
        cb(err,cooperative);
      });
    }
  });
};

exports.getConsumption = function(id, type, granularity, from, to, normalized, cb) {
  Cooperative.findOne({
    _id:id
  },function(err,cooperative){
    if (err) {
      cb(err);
    } else if (!cooperative) {
      cb('Cooperative not found');
    } else {
      getConsumption(cooperative,type,granularity,from,to,normalized,cb);
    }
  });
};

exports.getAll = function(cb){
  Cooperative.find({},cb);
};


exports.model = Cooperative;
