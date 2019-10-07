/* eslint-env serviceworker */

const CACHE_KEY = process.env.npm_package_version
const FILES = ['/'].concat(process.env.ASSET_LIST).filter(Boolean)

self.addEventListener('install', function oninstall (event) {
  event.waitUntil(
    caches
      .open(CACHE_KEY)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', function onactivate (event) {
  event.waitUntil(clear().then(function () {
    if (!self.registration.navigationPreload) return self.clients.claim()
    // enable navigation preloads
    return self.registration.navigationPreload.enable().then(function () {
      return self.clients.claim()
    })
  }))
})

self.addEventListener('fetch', function onfetch (event) {
  const req = event.request
  event.respondWith(
    caches.open(CACHE_KEY).then(function (cache) {
      return cache.match(req).then(update)

      // fetch request and update cache
      // (Response?) -> Response|Promise
      function update (cached) {
        if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') {
          return cached
        }

        if (event.preloadResponse) {
          return event.preloadResponse.then(function (response) {
            return response || self.fetch(req)
          }).then(onresponse).catch(onerror)
        }

        return self.fetch(req).then(onresponse).catch(onerror)

        // handle network response
        // Response -> Response
        function onresponse (response) {
          if (!response.ok) return cached || response
          if (req.method.toUpperCase() === 'GET') {
            return cache.put(req, response.clone()).then(() => response)
          }
          return response
        }

        // handle fetch error
        // Response -> Response
        function onerror (err) {
          if (cached) return cached
          return err
        }
      }
    })
  )
})

// clear application cache
// () -> Promise
function clear () {
  return caches.keys().then(function (keys) {
    return Promise.all(
      keys
        .filter((key) => key !== CACHE_KEY)
        .map((key) => caches.delete(key))
    )
  })
}
