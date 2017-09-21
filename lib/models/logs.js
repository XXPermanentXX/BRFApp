const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
 * Logging model for usage statistics and metrics
 */

const LogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed
  },
  date: {
    type: Date,
    required: true
  }
});

const Log = mongoose.model('Log', LogSchema);

exports.create = function create(log) {
  return Log.create({
    userId: log.userId,
    category: log.category,
    type: log.type,
    data: log.data,
    date: new Date()
  });
};

exports.all = function all(limit, skip) {
  return Log
    .find({})
    .sort({'date': -1})
    .skip(skip)
    .limit(limit)
    .exec();
};

exports.model = Log;
