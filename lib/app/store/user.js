const INIT = { credentials: 'include', headers: { accept: 'application/json' } }

module.exports = function user () {
  return (state, emitter) => {
    state.user = state.user || {}

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
  }
}
