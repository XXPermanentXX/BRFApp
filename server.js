require('dotenv/config')

const jalla = require('jalla')
const mount = require('koa-mount')
const mongoose = require('mongoose')
const compose = require('koa-compose')
const router = require('./lib/router')
const lang = require('./lib/middleware/lang')

const app = jalla('index.js', {
  serve: process.env.NODE_ENV !== 'development',
  css: 'index.css',
  skip: [
    require.resolve('moment'),
    require.resolve('mapbox-gl'),
    require.resolve('highcharts')
  ]
})
app.keys = [process.env.BRFENERGI_SESSION_SECRET]
app.proxy = true

app.on('error', console.error)

if (process.env.BRFENERGI_USER && process.env.BRFENERGI_PASS) {
  app.use(require('koa-basic-auth')({
    name: process.env.BRFENERGI_USER,
    pass: process.env.BRFENERGI_PASS
  }))
}

app.use(require('@koa/cors')())
app.use(require('koa-session')(app))
app.use(require('koa-methodoverride')('_method'))
app.use(require('./lib/middleware/health'))
app.use(require('./lib/middleware/geoip'))
app.use(require('./lib/middleware/error'))
app.use(require('./lib/middleware/auth')())
app.use(require('./lib/middleware/prismic'))

app.use(async function (ctx, next) {
  ctx.set('Access-Control-Allow-Origin', process.env.FORUM_URL)
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  if (!ctx.response.get('Cache-Control')) {
    ctx.set('Cache-Control', 'no-cache, max-age=0')
  }
  return next()
})

const routes = compose([router.routes(), router.allowedMethods()])
app.use(mount('/en', compose([lang('en'), routes])))
app.use(routes)

mongoose.Promise = Promise
console.log(1111111111, process.env.MONGO_URL)
mongoose.connect("mongodb+srv://shiqig_mongoDB:jGKPG3T8v-KS.XL@brfapp.ozxos53.mongodb.net/?retryWrites=true&w=majority&appName=BRFApp", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true
}).then(() => {
  app.listen(process.env.PORT || 8080)
}, err => {
  app.emit('error', err)
  process.exit(1)
})
