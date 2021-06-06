const jwt = require('jsonwebtoken')
const encryptor = require('simple-encryptor')(process.env.URL_ENCRYPTION_KEY)

exports.authenticationToken = function (user) {
  var profile = {
    metryID: user.metryId,
    name: user.profile.name,
    email: user.email
  }

  var encryptedMessage = encryptor.encrypt(profile)
  var jwtOptions = { expiresIn: '1h' }
  return jwt.sign({ msg: encryptedMessage }, process.env.BRFENERGI_SESSION_SECRET, jwtOptions)
}
