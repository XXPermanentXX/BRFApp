const devtools = require('choo-devtools')
const app = module.exports = require('./index')

app.use(devtools())
