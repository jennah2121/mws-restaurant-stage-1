const idb = require('idb');

const dbPromise = idb.open('restaurantsDB', 1, upgradeDB => {
  upgradeDB.createObjectStore('restaurants', {
    keyPath: 'id'
  });
  upgradeDB.createObjectStore('reviews', {
    keyPath: 'id'
  });
  upgradeDB.createObjectStore('reviewsOutbox', {
    keyPath: 'id'
  });
  upgradeDB.createObjectStore('favoritesOutbox', {
    keyPath: 'id'
  });
});

/**
 * Common database helper functions.
 */
module.exports = class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all reviews
   */
  static fetchReviews(callback) {
    dbPromise
      .then(db => {
        if (!db) {
          console.log('no db was created');
          return;
        }
        return db;
      })
      .then(db => {
        return db
          .transaction('reviews')
          .objectStore('reviews')
          .getAll();
      })
      .then(data => {
        if (data.length === 0) {
          // Fetch the reviews from the server and add it to db
          return fetch(`${DBHelper.DATABASE_URL}/reviews`)
            .then(response => {
              if (response.status !== 200) {
                console.log('error');
              }
              return response.json();
            })
            .then(fetchedData => {
              dbPromise.then(db => db).then(db => {
                let tx = db.transaction('reviews', 'readwrite');
                let store = tx.objectStore('reviews');
                fetchedData.forEach(review => {
                  store.put(review);
                });
              });
              callback(null, fetchedData);
            });
        } else {
          // return all the data in the database
          callback(null, data);
        }
      });
  }

  /**
   * Add a review to db
   */
  static addReviewToidb(formData) {
    dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').put(formData);
      return tx.complete;
    });

    dbPromise.then(db => {
      const tx = db.transaction('reviewsOutbox', 'readwrite');
      tx.objectStore('reviewsOutbox').put(formData);
      return tx.complete;
    });
  }

  /**
   * Get all the review in the outbox
   */
  static getAllFromReviewsOutbox() {
    return dbPromise.then(db => {
      return db
        .transaction('reviewsOutbox')
        .objectStore('reviewsOutbox')
        .getAll();
    });
  }

  /**
   * Delete review from outbox
   */
  static deleteFromOutbox(key) {
    console.log('deleting: ', key);
    dbPromise.then(db => {
      const tx = db.transaction('reviewsOutbox', 'readwrite');
      tx.objectStore('reviewsOutbox').delete(key);
      return tx.complete;
    });
  }

  /**
   * Add all the reviews in the outbox to the server
   */
  static addReviewsToServer() {
    console.log('about to add to server');
    return DBHelper.getAllFromReviewsOutbox().then(reviews => {
      return Promise.all(
        reviews.map(review => {
          return fetch(
            `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${
              review.restaurant_id
            }&name=${review.name}&rating=${review.rating}&comments=${
              review.comments
            }`,
            {
              method: 'POST'
            }
          ).then(response => {
            if (response.status === 201) {
              return DBHelper.deleteFromOutbox(review.id);
            }
          });
        })
      ).catch(error => {
        console.log('There was an error: ', error);
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    dbPromise
      .then(db => {
        if (!db) {
          console.log('no db was created');
          return;
        }
        return db;
      })
      .then(db => {
        return db
          .transaction('restaurants')
          .objectStore('restaurants')
          .getAll();
      })
      .then(data => {
        if (data.length === 0) {
          // Fetch the data from the server and add it to db
          return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
            .then(response => {
              if (response.status !== 200) {
                console.log('error');
              }
              return response.json();
            })
            .then(fetchedData => {
              dbPromise.then(db => db).then(db => {
                let tx = db.transaction('restaurants', 'readwrite');
                let store = tx.objectStore('restaurants');
                fetchedData.forEach(restaurant => {
                  if (!restaurant.hasOwnProperty('is_favorite')) {
                    restaurant.is_favorite = false;
                  }
                  store.put(restaurant);
                });
              });
              console.log('after add to db: ', fetchedData);
              callback(null, fetchedData);
            });
        } else {
          //return all the data in the database
          callback(null, data);
        }
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Fetch restaurants based on favourite status
   */
  static fetchRestaurantByFavouriteStatus(show, callback) {
    //Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // use the show argument to return what the user wants
        if (show === 'true' || show === 'false') {
          if (show == 'true') show = true;
          if (show == 'false') show = false;

          const data = restaurants.filter(
            restaurant => restaurant.is_favorite == show
          );

          callback(null, data);
        } else {
          // Return all the restaurants
          callback(null, restaurants);
        }
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) {
      restaurant.photograph = restaurant.id;
    }

    //create an object which contains all the photo sizes for the restaurant id
    let imagesObj = {
      original: `/images/${restaurant.photograph}.jpg`,
      smallMain: `/images/${restaurant.photograph}-small-main.jpg`,
      largeMain: `/images/${restaurant.photograph}-large-main.jpg`,
      smallDetails: `/images/${restaurant.photograph}-small-details.jpg`,
      medDetails: `/images/${restaurant.photograph}-med-details.jpg`,
      largeDetails: `/images/${restaurant.photograph}-large-details.jpg`
    };

    return imagesObj;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(map);
    return marker;
  }

  /**
   * Mark a restuaruant as a favourite
   */
  static markFavourite(id) {
    dbPromise
      .then(db => {
        return db
          .transaction('restaurants')
          .objectStore('restaurants')
          .get(parseInt(id));
      })
      .then(restaurant => {
        restaurant.is_favorite = restaurant.is_favorite ? false : true;

        return dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          tx.objectStore('restaurants').put(restaurant);

          const tx2 = db.transaction('favoritesOutbox', 'readwrite');
          tx2.objectStore('favoritesOutbox').put(restaurant);

          return tx.complete;
        });
      });
  }
};
