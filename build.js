require('dotenv/config')

const jalla = require('jalla')
const app = jalla('index.js', {
  css: 'index.css',
  skip: [
    require.resolve('moment'),
    require.resolve('mapbox-gl'),
    require.resolve('highcharts')
  ]
})

app.build('dist').then(function () {
  process.exit(0)
}, function (err) {
  console.error(err)
  process.exit(1)
})
