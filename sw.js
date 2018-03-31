// cache the skeleton html
// cache the static resources
// cache all the images 
var staticCacheName = 'restaurant-static-v1';
var imagesCache = 'restaurant-images';
var allCaches = [
    staticCacheName,
    imagesCache
];

/**
 * Add an install event for the service worker and cache static resources
 */
self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open('staticCacheName').then(function(cache){
            return cache.addAll([
                'index.html',
                'css/styles.css',
                'data/restaurants.json',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js'
            ])
        }).catch(function(error){
            console.log('An error occurred with caching')
        })
    );
})

