var staticCacheName = 'restaurant-static-v1';
var imagesCache = 'restaurant-images';
var allCaches = [staticCacheName, imagesCache];

/**
 * Add an install event for the service worker and cache static resources
 */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
      .open('staticCacheName')
      .then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'restaurant.html',
          'css/styles.css',
          'js/dbhelper.js',
          'js/main.js',
          'js/restaurant_info.js',
          '/manifest.json'
        ]);
      })
      .catch(function(error) {
        console.log('An error occurred with caching');
      })
  );
});

/**
 * Add a fetch event and cache any images
 */

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  if (url.origin === location.origin) {
    if (url.pathname === '/') {
      event.respondWith(caches.match('index.html'));
      return;
    }

    if (url.pathname.startsWith('/restaurant')) {
      event.respondWith(caches.match('restaurant.html'));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || serveAndCache(event.request);
    })
  );
});

/**
 *  Get a response from the network and cache this response
 */
function serveAndCache(request) {
  var storageUrl = request.url.replace(/(\d{1})-\w+-\w+\.jpg/, '$1');

  return caches.open(imagesCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(image) {
        cache.put(storageUrl, image.clone());
        return image;
      });
    });
  });
}
