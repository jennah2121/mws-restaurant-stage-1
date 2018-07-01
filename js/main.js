let restaurants,
  neighborhoods,
  cuisines,
  observer,
  newMap,
  markers = [];

const DBHelper = require('./dbhelper.js');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  updateRestaurants();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Register a service worker
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('../sw.js')
    .then(function(reg) {
      console.log('service worker registered');
    })
    .catch(function(err) {
      console.log('service worker registration failed');
    });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

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
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

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
};

/**
 * Initialise map if the user requests the map
 */
document.querySelector('#map').addEventListener('click', () => {
  if (newMap === undefined) initMap();
});

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}',
    {
      mapboxToken: '@@<your MAPBOX API KEY HERE>',
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }
  ).addTo(newMap);

  updateRestaurants();

  // Hide map load text for screen-readers
  document.querySelector('.load-text').setAttribute('aria-hidden', 'true');

  // Change map cursor after intialisation
  document.querySelector('#map').style.cursor = '-webkit-grab';
};

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

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers !== undefined) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  if (newMap !== undefined) addMarkersToMap();
  createObserver();
};

/**
 * Create an observer to watch for when li's become visible
 */
createObserver = () => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  const imagesList = document.querySelectorAll('#restaurants-list li');

  observer = new IntersectionObserver(lazyLoadImage, options);
  imagesList.forEach(image => {
    observer.observe(image);
  });
};

/**
 * Load images only when they become visible
 */
lazyLoadImage = entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
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
  });
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  let imagesObj = DBHelper.imageUrlForRestaurant(restaurant);

  const li = document.createElement('li');
  const picture = document.createElement('picture');

  const source1 = document.createElement('source');
  source1.setAttribute('media', '(min-width: 321px)');
  source1.setAttribute(
    'data-srcset',
    `${imagesObj.largeMain} 1x, ${imagesObj.largeMain} 2x`
  );

  const source2 = document.createElement('source');
  source2.setAttribute('media', '(min-width: 0px)');
  source2.setAttribute(
    'data-srcset',
    `${imagesObj.smallMain} 1x, ${imagesObj.smallMain} 2x`
  );

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', `${imagesObj.largeMain}`);
  //image.src = imagesObj.largeMain;
  image.alt = `A picture of ${restaurant.name} restaurant`;

  picture.append(source1);
  picture.append(source2);
  picture.append(image);
  li.append(picture);

  const container = document.createElement('div');
  container.classList.add('restaurant-text-container');

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  container.append(name);

  const fave = document.createElement('button');
  fave.innerHTML = '★';
  fave.setAttribute('aria-label', 'Add as favourite');
  fave.addEventListener('click', event => {
    markAsFavourite(event);
  });

  restaurant.is_favorite
    ? fave.classList.add('favourite-button', 'favourited')
    : fave.classList.add('favourite-button');
  container.append(fave);

  li.append(container);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  li.append(more);

  const id = more.href.split('=')[1];
  fave.setAttribute('data-rid', id);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

/**
 * Mark a restaurant as a favourite in db
 * if successsful css updated
 */
markAsFavourite = event => {
  event.target.classList.toggle('favourited');
  const id = event.target.getAttribute('data-rid');
  DBHelper.markFavourite(id);
};
