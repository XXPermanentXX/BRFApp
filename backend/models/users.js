const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PUBLIC_PROPS = {
  email: true,
  profile: true,
  cooperative: true
};

const UserSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  metryId: {
    type: String,
    requried: true
  },
  accessToken: String,
  profile: {
    name: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: 'sv'
    }
  },
  cooperative: {
    type: Schema.Types.ObjectId,
    ref: 'Cooperative',
    required: true
  }
});

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

exports.get = function (id, done) {
  User
    .findOne({ _id: id })
    .populate('cooperative')
    .exec(done);
};

exports.getProfile = function(id, done) {
  User
    .findOne({ _id: id }, PUBLIC_PROPS)
    .populate('cooperative')
    .exec(done);
};

exports.model = User;
