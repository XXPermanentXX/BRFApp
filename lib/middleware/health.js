const compose = require('koa-compose')
const Router = require('@koa/router')

const router = new Router()

module.exports = compose([router.routes(), router.allowedMethods()])

router.get('/_health', function (ctx, next) {
  ctx.status = 200
  ctx.body = 'OK'
})
