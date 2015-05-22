'use strict';

//var config = require('../config');

var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;

var ActionSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  impact: {
    type: Number,
    min: 1,
    max: 100,
    default: 10
  },
  effort: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  ratings: {
    type: [
      {
        _id: String, // username of commenter
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true
        },
        comment: String
      }
    ],
    default: []
  }
});

var Action = mongoose.model('Action', ActionSchema);

var includeRatingStats = function(action) {
  var cnt = 0;
  var sum = 0;

  _.each(action.ratings, function(rating) {
    sum += rating.rating;
    cnt++;
  });

  action.avgRating = cnt ? sum / cnt : 0;
  action.numRatings = cnt;
};

exports.create = function(name, description, impact, effort, cb) {
  Action.create({
    name: name,
    description: description,
    impact: impact,
    effort: effort
  }, cb);
};

exports.get = function(id, cb) {
  Action.findOne({
    _id: id
  }, function(err, action) {
    if (err) {
      cb(err);
    } else if (!action) {
      cb('Action not found');
    } else {
      action = action.toObject();
      includeRatingStats(action);
      cb(null, action);
    }
  });
};

exports.delete = function(id, cb) {
  Action.remove({
    _id: id
  }, cb);
};

exports.all = function(limit, skip, includeRatings, cb) {
  Action
  .find({})
  .sort({'date': -1})
  .skip(skip)
  .limit(limit)
  .exec(function(err, actions) {
    if (err) {
      cb(err);
    } else {
      // convert every returned action into a raw object (remove mongoose magic)
      for (var i = 0; i < actions.length; i++) {
        actions[i] = actions[i].toObject();
      }

      // calculate rating stats for each action
      _.each(actions, includeRatingStats);

      // get rid of ratings
      if (!includeRatings) {
        _.each(actions, function(action) {
          action.ratings = undefined;
        });
      }
      cb(null, actions);
    }
  });
};

exports.rate = function(id, user, rating, comment, cb) {
  // TODO: get username via auth token
  var username = user;

  Action.findOne({
    _id: id
  }, function(err, action) {
    if (err) {
      cb(err);
    } else if (!action) {
      cb('Action not found');
    } else {
      action.ratings.addToSet({
        _id: username,
        rating: rating,
        comment: comment
      });
      console.log(require('util').inspect(action));
      action.save(function(err) {
        cb(err);
      });
      /*
      action.ratings.findOne({})
      .exec(function(err, rating) {
        console.log(err, rating);
      });
      */
    }
  });
};

/*
// this functionality maybe belongs in user.js
exports.allByUser = function(user, cb) {
  cb(null, []);
};
*/
