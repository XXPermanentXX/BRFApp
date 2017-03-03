const async = require('async');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Cooperatives = require('./cooperatives');
const escapeStringRegexp = require('escape-string-regexp');

const ActionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  types: {
    type: [String],
    required: true
  },
  cost: Number,
  description: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  comments: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    default: []
  },
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  cooperative: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Cooperative'
  }
});

/**
 * Add a hook that removes action from it's parent cooperative
 */

ActionSchema.pre('remove', next => {
  async.parallel([
    done => this.model('Comment').remove({ action: this._id }, done),
    done => Cooperatives
      .findOne({ _id: this.cooperative }, { actions: true })
      .exec((err, cooperative) => {
        if (err) { return done(err); }
        const index = cooperative.actions.findIndex(id => id === this.id);
        cooperative.comments.splice(index, 1);
        cooperative.markModified('actions');
        cooperative.save(err => {
          if (err) { return done(err); }
          done(null);
        });
      })
  ], next);
});

const Actions = mongoose.model('Action', ActionSchema);

exports.create = function(props, user, cooperative, done) {
  Actions.create({
    name: props.name,
    description: props.description,
    cost: props.cost,
    types: props.types,
    user: typeof user === 'object' ? user._id : user,
    cooperative: typeof cooperative === 'object' ? cooperative._id : cooperative
  }, (err, action) => {
    if (err) { return done(err); }
    Cooperatives.model.findOne({ _id: action.cooperative }, (err, cooperative) => {
      if (err) { return done(err); }
      cooperative.actions.push(action._id);
      cooperative.markModified('actions');
      cooperative.save(err => {
        if (err) { return done(err); }
        done(null, action);
      });
    });
  });
};

exports.get = function(id, done) {
  Actions
    .findOne({ _id: id })
    .populate('comments')
    .exec((err, action) => {
      if (err) {
        return done(err);
      } else if (!action) {
        return done(new Error('Action not found'));
      }
      done(null, action.toObject());
    });
};

exports.getByCooperative = function(cooperative, limit, done) {
  if (typeof limit === 'function') {
    done = limit;
    limit = null;
  }

  Actions.find({ cooperative: cooperative._id })
    .sort({ date: -1 })
    .limit(limit)
    .populate('comments')
    .exec((err, actions) => {
      if (err) { return done(err); }
      done(null, actions.map(action => action.toObject()));
    });
};

exports.update = function (id, props, done) {
  Actions
    .findByIdAndUpdate(id, { $set: props })
    .populate('comments')
    .exec(done);
};

exports.delete = function(id, done) {
  Actions.remove({ _id: id }, done);
};

exports.getSuggested = function(user, done) {
  const userActions = user.actions;

  Actions.find({
    $and: [
      {_id: {$nin: Object.keys(userActions.done)}},
      {_id: {$nin: Object.keys(userActions.declined)}},
      {_id: {$nin: Object.keys(userActions.na)}},
      {_id: {$nin: Object.keys(userActions.pending)}},
      {_id: {$nin: Object.keys(userActions.inProgress)}}
    ]})
    .select('name description')
    .exec((err, actions) => {
      if (err) { return done(err); }
      done(null, actions.map(action => action.toObject()));
    });
};

//Search action by name and tag attached to name
exports.search = function(str, done) {
  Actions.find(
    {
      $or: [{
        name: new RegExp('^' + escapeStringRegexp(str), 'i')
      }]
    },
    (err, actions) => {
      if (err) { return done(err); }
      done(null, actions.map(action => action.toObject()));
    });
};

exports.getAll = function(limit, done){
  if (typeof limit === 'function') {
    done = limit;
    limit = null;
  }

  Actions.find({}).limit(limit).populate('comments').exec(done);
};

exports.model = Actions;
