const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('underscore');
const Schema = mongoose.Schema;
const async = require('async');
const { getEnergimolnetConsumption } = require('./consumption');

const HOUSEHOLD_DEFAULT_DEDUCTION = 30;
const DYNAMIC_KEYS = [
  'name',
  'email',
  'lng',
  'lat',
  'yearOfConst',
  'area',
  'numOfApartments',
  'meters',
  'ventilationType',
  'incHouseholdElectricity',
  'hasLaundryRoom',
  'hasGarage',
  'hasCharger',
  'hasEnergyProduction',
  'hasRepresentative',
  'hasConsumptionMapping',
  'hasGoalManagement',
  'hasBelysningsutmaningen',
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
  incHouseholdElectricity: Boolean,
  hasLaundryRoom: Boolean,
  hasGarage: Boolean,
  hasCharger: Boolean,
  hasEnergyProduction: Boolean,
  hasRepresentative: Boolean,
  hasConsumptionMapping: Boolean,
  hasGoalManagement: Boolean,
  hasBelysningsutmaningen: Boolean,
  needUpdate: Boolean,
  meters: [
    new Schema({
      type: String,
      meterId: String,
    })
  ],
  performances: [
    new Schema({
      year: Number,
      month: Number,
      value: Number,
      area: Number,
      isGuesstimate: Boolean
    })
  ],
  actions: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Action'
    }],
    default: []
  },
  editors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

/**
 * Add a hook that removes action from it's parent cooperative
 */

CooperativeSchema.pre('remove', next => {
  this.model('Action').remove({ cooperative: this._id }, next);
});

/**
 * Prevent JSON responses from including populated fields
 */

CooperativeSchema.methods.toJSON = function toJSON() {
  const props = this.toObject();

  props._id = this._id.toString();
  props.actions = props.actions.map(action => (action._id || action).toString());
  props.editors = props.editors.map(editor => (editor._id || editor).toString());

  return props;
};

const Cooperatives = mongoose.model('Cooperative', CooperativeSchema);

function getConsumption(cooperative, options, done) {
  const { types, granularity, from, to, normalized } = options;
  const { meters, area } = cooperative;

  getEnergimolnetConsumption(
    { meters, types, granularity, from, to, normalized },
    (err, results) => {
      if (err) { return done(err); }
      done(null, results.map(value => value / (area ? area : 1)));
    });
}

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
    return done(null);
  } else {
    // Get the last 13 months to ensure 12 actual values
    // since the current month may not have any value yet
    const from = moment(now).subtract(12, 'months').format('YYYYMM');
    const to = moment(now).format('YYYYMM');
    const options = { granularity: 'month', from, to, normalized: false };

    if (cooperative.incHouseholdElectricity === false) {

      /**
       * If the coopereative has expressively specified that households are not
       * included, fetch heat and electricity combined
       */

      getConsumption(props, Object.assign({ types: [ 'heat', 'electricity' ]}, options), (err, result) => {
        if (err) { return done(err); }
        setPerfomance(result);
      });
    } else {

      /**
       * Fetch heat and electricity seperately so that we can deduct houshold
       * consumption from electricity usage before calculating the sum
       */

      Promise.all(
        [ 'heat', 'electricity' ].map(type => {
          if (!cooperative.meters.find(meter => meter.type === type)) {
            // Resolve to an empty array for missing meters
            return [];
          }

          return new Promise((resolve, reject) => {
            getConsumption(props, Object.assign({ types: [ type ]}, options), (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        }).filter(Boolean)
      ).then(([ heat, electricity ]) => {
        let isGuesstimate = false;
        let deductHouseholdConsumption = cooperative.incHouseholdElectricity;
        const total = electricity.reduce((mem, value) => mem + value, 0);

        if (typeof cooperative.incHouseholdElectricity === 'undefined') {
          if ((total / cooperative.area) > 50) {
            deductHouseholdConsumption = true;
          } else if ((total / cooperative.area) > 20) {
            isGuesstimate = true;
          }
        }

        let values = electricity.map((value, index) => {
          return (value || 0) + (heat[index] || 0);
        });

        setPerfomance(values, isGuesstimate, deductHouseholdConsumption);
      }, done);
    }
  }

  /**
   * Set cooperative performance with given values
   * @param {array} values List of values from which to calculate performance
   * @param {boolean} isGuesstimate Whether the values were guestimated
   */

  function setPerfomance(values, isGuesstimate = false, deduct = false) {
    let value = values
      // Remove any empty values (i.e. current month)
      .filter(Boolean)
      // Take the last 12 (last year)
      .slice(-12)
      // Summarize consumtion
      .reduce((memo, num) => memo + num, 0);

    if (!value) {
      return done(null);
    }

    if (deduct) {
      // Deduct houshold consumption
      value -= HOUSEHOLD_DEFAULT_DEDUCTION * cooperative.area;
    }

    // Figure out whether the last month is missing
    const missing = values[values.length - 1] ? 0 : 1;

    cooperative.performances.push({
      year: now.getFullYear(),
      month: moment(now).subtract(missing, 'months').month(),
      area: cooperative.area,
      value: value,
      isGuesstimate: isGuesstimate
    });

    cooperative.save(err => {
      if (err) { return done(err); }
      done(null);
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
  Cooperatives.find({
    meters: {
      $not: { $size: 0 }
    }
  }, (err, cooperatives) => {
    if (err) { return done(err); }

    Promise.all(cooperatives.map(cooperative => {
      return new Promise((resolve, reject) => {
        calculatePerformance(cooperative, err => {
          if (err) { return reject(err); }
          resolve();
        });
      });
    })).then(
      () => done(null, cooperatives),
      // Silently fail as we still have some outdated meter IDs
      // FIXME: callback with error properly
      () => done(null, cooperatives)
    );
  });
};

exports.get = function (id, done) {
  Cooperatives
    .findOne({ _id: id })
    .populate('actions')
    .populate('editors')
    .exec((err, cooperative) => {
      if (err) { return done(err); }
      if (!cooperative) { return done(new Error('Cooperative not found')); }

      calculatePerformance(cooperative, err => {
        // Silently fail as we still have some outdated meter IDs
        // FIXME: callback with error properly
        // if (err) { return done(err); }
        done(null, cooperative);
      });
    });
};

exports.getProfile = function(id, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }
    if (!cooperative) { return done(new Error('Cooperative not found')); }

    done(null, cooperative);
  });
};

exports.update = function(id, data, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) { return done(err); }

    const selection = {};
    const areaChanged = data.area && (cooperative.area !== data.area);

    Object.keys(data).filter(key => DYNAMIC_KEYS.includes(key)).forEach(key => {
      selection[key] = data[key];
    });

    // Assign all data to cooperative
    Object.assign(cooperative, selection, { needUpdate: false });

    if (areaChanged || data.incHouseholdElectricity !== cooperative.incHouseholdElectricity) {
      // Remove last perfomance calculation if area has changed
      cooperative.performances.$pop();

      // Recalculate latest performance
      calculatePerformance(cooperative, err => {
        // Silently fail as we still have some outdated meter IDs
        // FIXME: callback with error properly
        // if (err) { return done(err); }
        done(null, cooperative);
      });
    } else {
      cooperative.save(done);
    }
  });
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

exports.getAvgConsumption = function (types, granularity, from, to, cb) {
  Cooperatives.find({}, function (err, cooperatives){
    if (err) { return cb(err); }

    async.map(cooperatives, function (cooperative, cb2) {
      getConsumption(
        cooperative,
        { types, granularity, from, to, normalized: false },
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
        type:type,
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

exports.getConsumption = function(id, options, done) {
  Cooperatives.findOne({ _id: id }, (err, cooperative) => {
    if (err) {
      done(err);
    } else if (!cooperative) {
      done(new Error('Cooperative not found'));
    } else {
      getConsumption(cooperative, options, (err, consumption) => {
        // Silently fail as we still have some outdated meter IDs
        // FIXME: callback with error properly
        done(null, consumption || []);
      });
    }
  });
};

exports.getAll = function(cb){
  Cooperatives.find({}, cb);
};

exports.model = Cooperatives;
