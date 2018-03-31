let restaurants,
  neighborhoods,
  cuisines,
  observer
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Register a service worker
 */
if(navigator.serviceWorker) {
  navigator.serviceWorker.register('../sw.js').then(function(reg){
    console.log('service worker registered');
  }).catch(function(err){
    console.log('service worker registration failed')
  });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  createObserver();
}


/**
 * Create an observer to watch for when li's become visible
 */
createObserver = () => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.10
  }
  const imagesList = document.querySelectorAll('#restaurants-list li');
  
  observer = new IntersectionObserver(lazyLoadImage, options);
  imagesList.forEach(image => {
    observer.observe(image)
  });
}

/**
 * Load images only when they become visible 
 */
lazyLoadImage = (entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      let source1 = entry.target.firstChild.firstChild;
      let source2 = source1.nextSibling;
      let image = source2.nextSibling;

      //stop watching the image
      observer.unobserve(entry.target);

      //set the srcset attribute of the sources and the src attribute of image
      source1.setAttribute('srcset', `${source1.getAttribute('data-srcset')}`);
      source2.setAttribute('srcset', `${source2.getAttribute('data-srcset')}`);
      image.setAttribute('src', `${image.getAttribute('data-src')}`);

    }
  })
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  let imagesObj = DBHelper.imageUrlForRestaurant(restaurant);
  
  const li = document.createElement('li');
  const picture = document.createElement('picture');

  const source1 = document.createElement('source');
  source1.setAttribute('media', '(min-width: 321px)');
  source1.setAttribute('data-srcset', `${imagesObj.largeMain} 1x, ${imagesObj.largeMain} 2x`) 

  const source2 = document.createElement('source');
  source2.setAttribute('media', '(min-width: 0px)');
  source2.setAttribute('data-srcset', `${imagesObj.smallMain} 1x, ${imagesObj.smallMain} 2x`)

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', `${imagesObj.largeMain}`);
  //image.src = imagesObj.largeMain;
  image.alt = `A picture of ${restaurant.name} restaurant`;

  picture.append(source1);
  picture.append(source2);
  picture.append(image);
  li.append(picture);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
