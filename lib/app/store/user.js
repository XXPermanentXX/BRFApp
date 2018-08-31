const got = require('got')
const INIT = { credentials: 'include', headers: { accept: 'application/json' } }

module.exports = function user () {
  return (state, emitter) => {
    state.user = state.user || {}
    state.user.notificationsAmount = -1

    var rerender = () => emitter.emit('render')

    if (state.user.isAuthenticated) {
      let requestOptions = {retry: 0,
        headers: {brfauth: state.user.forumAuthenticationToken, 'Cache-Control': 'no-store'}}

      got(process.env.FORUM_URL + '/api/unread', requestOptions)
      .then((resp) => {
        var json = JSON.parse(resp.body)
        console.log(json)
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
    }

    emitter.prependListener('navigate', function () {
      if (!state.user.hasBoarded) emitter.emit('user:boarded')
    })

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
          if (!response.ok) { return Promise.reject(user) }
          state.user = user
        }).catch(err => {
          state.error = err.message
        })).then(rerender)
      } else {
        state.user.hasBoarded = true
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2)
        document.cookie = `HAS_BOARDED=true; expires=${expires}; path=/`
        rerender()
      }
    })

    emitter.on(state.events.DOMCONTENTLOADED, () => {
      console.log('lodaded')
      state.notificationsAmount = -1
      state.notificationString = '(-1)'
      rerender()
    })
  }
}
