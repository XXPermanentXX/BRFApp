const mongoose = require('mongoose');
const Comments = require('./comments');
const escapeStringRegexp = require('escape-string-regexp');

const ActionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  cost: Number,
  contractor: String,
  description: String,
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  comments: [ Comments.Schema ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  cooperative: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Cooperative'
  }
});

/**
 * Add a hook that removes action from it's parent cooperative
 */

ActionSchema.pre('remove', function (next) {
  this.model('Cooperative').update({ _id: this.cooperative }, {
    $pull: { actions: this._id }
  }, next);
});

/**
 * Prevent JSON responses from including populated fields
 */

ActionSchema.methods.toJSON = function toJSON() {
  const props = this.toObject();

  props._id = this._id.toString();
  props.cooperative = (props.cooperative._id || props.cooperative).toString();
  props.user = (props.user._id || props.user).toString();
  props.comments = this.comments.map(comment => comment.toJSON());

  return props;
};

const Actions = mongoose.model('Action', ActionSchema);

exports.create = function(props, user, cooperative, done) {
  Actions.create({
    type: props.type,
    date: props.date,
    cost: props.cost,
    description: props.description,
    user: user._id,
    cooperative: cooperative._id,
    comments: []
  }, (err, action) => {
    if (err) { return done(err); }
    cooperative.actions.push(action._id);
    cooperative.markModified('actions');
    cooperative.save(err => {
      if (err) { return done(err); }
      done(null, action);
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
  Actions.findById(id, (err, doc) => {
    if (err) { return done(err); }
    doc.remove(done);
  });
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
