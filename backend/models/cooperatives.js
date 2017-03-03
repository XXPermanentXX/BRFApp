const mongoose = require('mongoose');
const _ = require('underscore');
const Schema = mongoose.Schema;
const async = require('async');
const { getEnergimolnetConsumption } = require('./consumption');

const DYNAMIC_KEYS = [
  'name',
  'email',
  'lng',
  'lat',
  'yearOfConst',
  'area',
  'numOfApartments',
  'meters',
  'ventilationType'
];

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
  ventilationType: [String],
  meters: [{
    mType: String,
    useInCalc: Boolean,
    meterId: String,
  }],
  performances: [{
    year: Number,
    value: Number,
    area: Number
  }],
  actions: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Action'
    }],
    default: []
  },
  editors: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
});

/**
 * Add a hook that removes action from it's parent cooperative
 */

CooperativeSchema.pre('remove', next => {
  this.model('Action').remove({ cooperative: this._id }, next);
});

const Cooperatives = mongoose.model('Cooperative', CooperativeSchema);

function getConsumption(cooperative, options, done) {
  const { type, granularity, from, to, normalized } = options;
  const { meters, area } = cooperative;

  getEnergimolnetConsumption(meters, type, granularity, from, to, normalized, (err, results) => {
    if (err) { return done(err); }
    done(null, results.map(value => value / (area ? area : 1)));
  });
}

function calculatePerformance(props, done) {
  const year = new Date().getFullYear();
  const performance = props.performances.find(perf => perf.year === year);

  if (performance) {
    props.performance = performance.value;
    return done(null, props);
  } else {
    const params = {
      type: 'heating',
      granularity: 'month',
      from: year - 1,
      to: null,
      normalized: false
    };

    getConsumption(props, params, (err, result) => {
      if (err) { return done(err); }

      const value = result.reduce((sum, num) => sum + num, 0);

      props.performance = value;
      props.performances.push({ year, value, area: props.area });
      Cooperatives.findByIdAndUpdate(
        props._id,
        { $set: { performances: props.performances }},
        () => 1
      );

      done(null, props);
    });
  }
}

exports.create = function(props, user, done) {
  Cooperatives.create({
    name: props.name,
    email: props.email,
    lng: props.lng,
    lat: props.lat,
    yearOfConst: props.yearOfConst,
    area: props.area,
    numOfApartments: props.numOfApartments,
    meters: props.meters,
    ventilationType: props.ventilationType,
    editors: [ typeof user === 'object' ? user._id : user ]
  }, done);
};

exports.all = function(done) {
  Cooperatives.find({}, (err, cooperatives) => {
    if (err) { return done(err); }
    async.map(
      cooperatives.map(cooperative => cooperative.toObject()),
      calculatePerformance,
      done
    );
  });
};

exports.get = function (id, done) {
  Cooperatives
    .findOne({ _id: id })
    .populate('actions')
    .exec((err, cooperative) => {
      if (err) { return done(err); }
      if (!cooperative) { return done(new Error('Cooperative not found')); }

      calculatePerformance(cooperative, done);
    });
};

exports.getProfile = function(id, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }
    if (!cooperative) { return done(new Error('Cooperative not found')); }

    done(null, cooperative);
  });
};

exports.update = function(id, props, done) {
  const selection = {};

  Object.keys(props).filter(key => DYNAMIC_KEYS.includes(key)).forEach(key => {
    selection[key] = props[key];
  });

  Cooperatives.findByIdAndUpdate(id, { $set : selection }, done);
};

exports.addEditor = function(id, user, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }
    if (!cooperative) { return done(new Error('Cooperative could not be found')); }
    cooperative.users.push(user._id);
    cooperative.markModified('users');
    cooperative.save(done);
  });
};

exports.deleteEditor = function(id, user, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }
    if (!cooperative) { return done(new Error('Cooperative could not be found')); }

    const index = cooperative.editors.findIndex(id => id === user._id);

    cooperative.editors.splice(index, 1);
    cooperative.markModified('editors');
    cooperative.save(done);
  });
};

exports.getAvgConsumption = function (type, granularity, from, to, cb) {
  Cooperatives.find({}, function (err, cooperatives){
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
  Cooperatives.findOne({
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
  Cooperatives.findOne({
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
  Cooperatives.find({}, cb);
};

exports.model = Cooperatives;
