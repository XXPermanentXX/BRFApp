const methodOverride = require('method-override')

module.exports = function method (key = '_method') {
  return methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && key in req.body) {
      // look in urlencoded POST bodies and delete it
      const method = req.body[key]
      delete req.body[key]
      return method
    }
  })
}
