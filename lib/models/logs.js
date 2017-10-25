const mongoose = require('mongoose');
const chalk = require('chalk');

/*
 * Logging model for usage statistics and metrics
 */

const LogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId
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
    type: mongoose.Schema.Types.Mixed
  },
  date: {
    type: Date,
    required: true
  }
});

LogSchema.post('save', function (doc) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info(`> ${ chalk.bold(doc.category) } [${ chalk.green(doc.type) }]${ doc.data ? `: ${ chalk.dim(JSON.stringify(doc.data)) }` : '' }`);
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
