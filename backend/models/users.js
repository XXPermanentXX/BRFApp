const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cooperatives = require('./cooperatives');

const PUBLIC_PROPS = {
  email: true,
  metryId: true,
  accessToken: true,
  profile: true,
  cooperativeId: true
};

const UserSchema = new Schema({
  email: String,
  metryId: String,
  accessToken: String,
  profile: {
    name: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  cooperativeId: Schema.Types.ObjectId
});

const User = mongoose.model('User', UserSchema);

exports.create = function(data, cb) {
  return User.create(data, cb);
};

exports.getProfile = function(id, done) {
  User.findOne({ _id: id }, PUBLIC_PROPS, (err, user) => {
    if (err) { return done(err); }
    if (!user) { return done(new Error('User not found')); }

    const profile = user.toObject();

    if (user.cooperativeId) {
      cooperatives.getProfile(user.cooperativeId, user, (err, cooperative) => {
        if (err) { return done(err); }

        const { name, _id } = cooperative;
        profile.cooperative = { name, _id };

        done(null, profile);
      });
    } else {
      done(null, profile);
    }
  });
};

exports.model = User;
