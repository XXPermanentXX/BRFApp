const got = require('got')
const INIT = { credentials: 'include', headers: { accept: 'application/json' } }

module.exports = function user () {
  return (state, emitter) => {
    state.user = state.user || {}
    state.user.notificationsAmount = -1
    state.user.status = 'qwe'

    var rerender = () => emitter.emit('render')

    got(process.env.FORUM_URL + '/api/user/admin', { retry: 0 })
    .then((resp) => {
      var json = JSON.parse(resp.body)
      var str = 'Status: ' + json.status + 'x'
      console.log(str)
      state.user.status = str
    })
    .then(rerender)
    .catch((error) => {
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log(error)
        }
      }
    })

    console.log("SECRET: ")
    console.log(process.env.BRFENERGI_SESSION_SECRET)

    /*
    got(process.env.FORUM_URL + '/api/unread', { retry: 0, body: {brfAuth: nodebb.authenticationToken(state.user)}})
    .then((resp) => {
      var json = JSON.parse(resp.body)
      state.user.notificationsAmount = json.topicCount
    })
    .then(rerender)
    .catch((error) => {
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log(error)
        }
      }
    })
    */


    emitter.on('user:boarded', () => {
      if (state.user.isAuthenticated) {
        window.fetch(
          `/users/${state.user._id}`,
          Object.assign(
            {
              method: 'PUT',
              body: JSON.stringify({ hasBoarded: true })
            },
            INIT,
            {
              headers: Object.assign({ 'Content-Type': 'application/json' }, INIT.headers)
            }
          )
        ).then(response => response.json().then(user => {
          if (!response.ok) { Promise.reject(user) }
          state.user = user
          emitter.emit('render')
        }).catch(err => {
          state.error = err.message
          emitter.emit('render')
        }))
      } else {
        state.user.hasBoarded = true
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 28 * 3)
        document.cookie = `HAS_BOARDED=true; expires=${expires}; path=/`
        emitter.emit('render')
      }
    })

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      console.log('lodaded')
      state.notificationsAmount = -1
      state.notificationString = '(-1)'
      emitter.emit('render')
    })
  }
}
