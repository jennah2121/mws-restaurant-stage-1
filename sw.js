let staticCacheName = 'restaurant-static-v1';
let imagesCache = 'restaurant-images';
let allCaches = [staticCacheName, imagesCache];
const DBHelper = require('./js/dbhelper');

/**
 * Add an install event for the service worker and cache static resources
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(function(cache) {
        return cache.addAll([
          '/',
          'index.html',
          'restaurant.html',
          'css/styles.css',
          'js/dbhelper.js',
          'js/main.js',
          'js/restaurant_info.js',
          '/manifest.json',
          'images/RR-not-found.webp'
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

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

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
    caches
      .match(event.request)
      .then(response => response || serveAndCache(event.request))
  );
});

/**
 *  Get a response from the network and cache this response
 */
function serveAndCache(request) {
  let storageUrl = request.url.replace(/(\d{1})-\w+-\w+\.jpg/, '$1');

  return caches.open(imagesCache).then(cache => {
    return cache.match(storageUrl).then(response => {
      if (response) return response;

      return fetch(request)
        .then(image => {
          cache.put(storageUrl, image.clone());
          return image;
        })
        .catch(() => {
          return caches
            .open(staticCacheName)
            .then(cache =>
              cache.match('images/RR-not-found.webp').then(response => response)
            );
        });
    });
  });
}

/**
 * Add and activate event listener and delete old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(
              cache =>
                cache.startsWith('restaurant-') && !allCaches.includes(cache)
            )
            .map(oldCache => caches.delete(oldCache))
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Add a sync event
 */
self.addEventListener('sync', event => {
  if (event.tag === 'syncReviews') {
    event.waitUntil(DBHelper.addReviewsToServer());
  }

  if (event.tag === 'syncFavorites') {
    event.waitUntil(DBHelper.updateFavoritesInServer());
  }
});
