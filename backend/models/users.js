const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LEGACY_PROPS = [
  'achievements',
  'actions',
  'cooperativeId',
  'hash',
  'isAdmin',
  'numFeedback',
  'production',
  'salt',
  'testbed',
  'token',
];

const UserSchema = new Schema({
  email: {
    type: String,
    // required: true
  },
  metryId: {
    type: String,
    // requried: true
  },
  accessToken: String,
  profile: {
    name: {
      type: String,
      // required: true
    },
    language: {
      type: String,
      default: 'sv'
    }
  },
  cooperative: {
    type: Schema.Types.ObjectId,
    ref: 'Cooperative',
    // required: true
  }
});

/**
 * Prevent JSON responses from including populated fields
 */

UserSchema.methods.toJSON = function toJSON() {
  const props = this.toObject();

  for (let prop of LEGACY_PROPS) {
    delete props[prop];
  }

  delete props.metryId;
  delete props.accessToken;
  props.cooperative = props.cooperative._id || props.cooperative;

  return props;
};

const User = mongoose.model('User', UserSchema);

exports.create = function(props, done) {
  const { cooperative } = props;

  return User.create({
    email: props.email,
    metryId: props.metryId,
    accessToken: props.accessToken,
    profile: {
      name: props.name,
      language: props.lang
    },
    cooperative: typeof cooperative === 'object' ? cooperative._id : cooperative
  }, done);
};

exports.getProfile = exports.get = function (id, done) {
  User
    .findOne({ _id: id })
    .populate('cooperative')
    .exec(done);
};

exports.model = User;
