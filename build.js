require('dotenv/config')

const jalla = require('jalla')
const app = jalla('index.js', {
  css: 'index.css',
  sw: 'sw.js'
})

app.build('dist').then(function () {
  process.exit(0)
}, function (err) {
  console.error(err)
  process.exit(1)
})
