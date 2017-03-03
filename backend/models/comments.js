const mongoose = require('mongoose');
const Actions = require('./actions');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  action: {
    type: Schema.Types.ObjectId,
    ref: 'Action',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
});

/**
 * Add a hook that removes comment from it's parent action
 */

CommentSchema.pre('remove', next => {
  Actions
    .findOne({ _id: this.action }, { comments: true })
    .exec((err, action) => {
      if (err) { return next(err); }
      const index = action.comments.findIndex(id => id === this.id);
      action.comments.splice(index, 1);
      action.markModified('comments');
      action.save(err => {
        if (err) { return next(err); }
        next(null);
      });
    });
});

const Comments = mongoose.model('Comment', CommentSchema);

exports.create = function(props, user, action, done) {
  Comments.create({
    action: typeof action === 'object' ? action._id : action,
    user: typeof user === 'object' ? user._id : user,
    comment: props.comment
  }, (err, comment) => {
    if (err) { return done(err); }
    Actions.model.findOne({ _id: comment.action }, (err, action) => {
      if (err) { return done(err); }
      action.comments.push(comment._id);
      action.markModified('comments');
      action.save(err => {
        if (err) { return done(err); }
        done(null, comment);
      });
    });
  });
};

exports.get = function (id, done) {
  Comments.findOne({ _id: id }, (err, comment) => {
    if (err) { return done(err); }
    done(null, comment.toObject());
  });
};

exports.getByAction = function(action, limit, done) {
  if (typeof limit === 'function') {
    done = limit;
    limit = null;
  }

  Comments.find({ action: action._id })
    .sort({ date: -1 })
    .limit(limit)
    .exec((err, comments) => {
      if (err) { return done(err); }
      done(null, comments.map(comment => comment.toObject()));
    });
};

exports.getByUser = function(user, limit, done) {
  if (typeof limit === 'function') {
    done = limit;
    limit = null;
  }

  Comments.find({ user: user._id})
    .sort({'date': -1})
    .limit(limit)
    .exec((err, comments) => {
      if (err) { return done(err); }
      done(null, comments.map(comment => comment.toObject()));
    });
};

exports.delete = function(id, done) {
  Comments.remove({ action: id }, done);
};

exports.model = Comments;
