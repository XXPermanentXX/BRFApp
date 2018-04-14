module.exports = function actions () {
  return (state, emitter) => {
    state.actions = state.actions || []

    emitter.on('actions:update', data => {
      const opts = {
        method: 'PUT',
        body: JSON.stringify(data),
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
      window.fetch(`/actions/${data._id}`, opts).then(response => {
        return response.json().then(body => {
          if (!response.ok) return Promise.reject(body)
          const action = state.actions.find(action => action._id === data._id)
          if (!action) state.actions.push(body)
          else Object.assign(action, body)
          emitter.emit('pushState', `/cooperatives/${action.cooperative}`)
        })
      }).catch(err => emitter.emit('error', err))
    })

    emitter.on('actions:add', data => {
      const opts = {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
      window.fetch(`/actions`, opts).then(response => {
        return response.json().then(body => {
          if (!response.ok) { return Promise.reject(body) }
          state.actions.push(body)
          emitter.emit('cooperatives:fetch', body.cooperative)
          emitter.emit('pushState', `/cooperatives/${body.cooperative}`)
        })
      }).catch(err => emitter.emit('error', err))
    })

    emitter.on('actions:fetch', id => {
      if (Array.isArray(id)) {
        Promise.all(id.map(fetchAction)).then(results => {
          state.actions.push(...results)
          emitter.emit('render')
        })
      } else {
        fetchAction(id).then(body => {
          state.actions.push(body)
          emitter.emit('render')
        })
      }
    })

    /**
     * Fetch action by id
     * @param  {String} id Unique id for action to fetch
     * @return {Promise}   Resolves to actions data
     */

    function fetchAction (id) {
      const opts = {
        credentials: 'include',
        headers: { accept: 'application/json' }
      }
      return window.fetch(`/actions/${id}`, opts).then(response => {
        return response.json().then(body => {
          if (!response.ok) { return Promise.reject(body) }
          return body
        })
      }, err => emitter.emit('error', err))
    }
  }
}
