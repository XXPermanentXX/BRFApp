const async = require('async');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Cooperatives = require('./cooperatives');
const Comments = require('./comments');
const escapeStringRegexp = require('escape-string-regexp');

const ActionSchema = new Schema({
  name: {
    type: String,
    required: true
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
  comments: [ Comments.Schema ],
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

/**
 * Prevent JSON responses from including populated fields
 */

ActionSchema.methods.toJSON = function toJSON() {
  const props = this.toObject();

  props.cooperative = props.cooperative._id || props.cooperative;
  props.user = props.user._id || props.user;
  props.comments = this.comments.map(comment => comment.toJSON());

  return props;
};

const Actions = mongoose.model('Action', ActionSchema);

exports.create = function(props, user, cooperative, done) {
  Actions.create({
    name: props.name,
    description: props.description,
    cost: props.cost,
    types: props.types,
    user: user._id,
    cooperative: cooperative._id,
    comments: []
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
    .populate('comments.user')
    .populate('cooperative')
    .populate('user')
    .exec((err, action) => {
      if (err) {
        return done(err);
      } else if (!action) {
        return done(new Error('Action not found'));
      }
      done(null, action);
    });
};

exports.addComment = function(id, data, user, done) {
  Actions
    .findOne({ _id: id })
    .populate('comments.user')
    .populate('cooperative')
    .populate('user')
    .exec((err, action) => {
      if (err) { return done(err); }
      action.comments.push(Object.assign({
        user: user._id,
        author: user.profile.name
      }, data));
      action.markModified('comments');
      action.save(err => done(err, action));
    });
};

exports.getComment = function(id, done) {
  Actions.findOne({ 'comments._id': id }, (err, action) => {
    if (err) { return done(err); }
    done(null, action.comments.find(comment => comment._id === id));
  });
};

exports.deleteComment = function(id, done) {
  Actions.findOne({ 'comments._id': id }, (err, action) => {
    if (err) { return done(err); }
    action.comments.id(id).remove();
    action.save(done);
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
    .populate('comments.user')
    .populate('cooperative')
    .populate('user')
    .exec((err, actions) => {
      if (err) { return done(err); }
      done(null, actions);
    });
};

exports.update = function (id, props, done) {
  Actions
    .findByIdAndUpdate(id, { $set: props })
    .populate('comments.user')
    .populate('cooperative')
    .populate('user')
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
      done(null, actions);
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
      done(null, actions);
    });
};

exports.getAll = function(limit, done){
  if (typeof limit === 'function') {
    done = limit;
    limit = null;
  }

  Actions
    .find({})
    .limit(limit)
    .populate('comments.user')
    .populate('cooperative')
    .populate('user')
    .exec(done);
};

exports.model = Actions;
