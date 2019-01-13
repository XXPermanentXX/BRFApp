/* eslint-env serviceworker */

const CACHE_KEY = process.env.npm_package_version
const FILES = [
  '/',
  '/manifest.json'
].concat(process.env.ASSET_LIST).filter(Boolean)

self.addEventListener('install', function oninstall (event) {
  event.waitUntil(
    caches
      .open(CACHE_KEY)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', function onactivate (event) {
  event.waitUntil(clear().then(() => self.clients.claim()))
})

self.addEventListener('fetch', function onfetch (event) {
  const req = event.request
  event.respondWith(
    caches.open(CACHE_KEY).then(function (cache) {
      return cache.match(req).then(update)

      // fetch request and update cache
      // (Response?) -> Response|Promise
      function update (fallback) {
        if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') {
          return fallback
        }

        return self.fetch(req).then(function (response) {
          if (!response.ok) throw response
          else cache.put(req, response.clone())
          return response
        }).catch(function (err) {
          if (fallback) return fallback
          return err
        })
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
