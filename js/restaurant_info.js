let restaurantGlobal, observer, restaurant, newMap;

const DBHelper = require('./dbhelper.js');

/**
 * Register a service worker
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('../sw.js')
    .then(function(reg) {
      console.log('service worker registered for restaurant details page');
    })
    .catch(function(err) {
      console.log(
        'service worker registration failed for restaurant details page'
      );
    });
}

/**
 * Initialize the details page, called from HTML.
 */
document.addEventListener('DOMContentLoaded', event => {
  // Dynamically adjusts the margin for maincontent
  adjustMaincontentMargin();

  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      restaurantGlobal = restaurant;
      fillBreadcrumb();
      createObserver();
    }
  });
});

/**
 * Create an observer to watch for when the map div is visible
 */
createObserver = () => {
  let options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
  };
  var mapDiv = document.getElementById('map');
  observer = new IntersectionObserver(myInitMap, options);
  observer.observe(mapDiv);
};

/**
 * Initialise and show the map if mapDiv visible
 */
myInitMap = (entry, observer) => {
  if (entry[0].isIntersecting) {
    observer.unobserve(entry[0].target);
    newMap = L.map('map', {
      center: [restaurantGlobal.latlng.lat, restaurantGlobal.latlng.lng],
      zoom: 16,
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
    fillBreadcrumb();
    DBHelper.mapMarkerForRestaurant(restaurantGlobal, newMap);
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const fave = document.getElementById('restaurant-fave-btn');
  fave.innerHTML = '★';
  fave.setAttribute('data-rid', restaurant.id);
  fave.addEventListener('click', event => {
    markAsFavourite(event);
  });
  if (restaurant.is_favorite) fave.classList.add('favourited');

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  let imagesObj = DBHelper.imageUrlForRestaurant(restaurant);

  const picture = document.getElementById('restaurant-img');

  const source1 = document.createElement('source');
  source1.setAttribute('media', '(min-width: 425px)');
  source1.setAttribute(
    'srcset',
    `${imagesObj.largeDetails} 1x, ${imagesObj.largeDetails} 2x`
  );

  const source2 = document.createElement('source');
  source2.setAttribute('media', '(min-width: 375px)');
  source2.setAttribute(
    'srcset',
    `${imagesObj.medDetails} 1x, ${imagesObj.medDetails} 2x`
  );

  const source3 = document.createElement('source');
  source3.setAttribute('media', '(min-width: 0px)');
  source3.setAttribute(
    'srcset',
    `${imagesObj.smallDetails} 1x, ${imagesObj.smallDetails} 2x`
  );

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = imagesObj.largeDetails;
  image.alt = `A picture of ${restaurant.name} restaurant`;

  picture.append(source1);
  picture.append(source2);
  picture.append(source3);
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const addReviewBtn = document.createElement('button');
  addReviewBtn.innerHTML = 'Write Review';
  addReviewBtn.classList.add('add-review');
  addReviewBtn.addEventListener('click', createFormHTML);
  container.appendChild(addReviewBtn);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Create a form and it to the webpage
 */
createFormHTML = () => {
  const formExists = document.getElementById('form-reviews');

  if (formExists) {
    formExists.classList.toggle('hidden');
  } else {
    const container = document.getElementById('reviews-container');
    const form = document.createElement('form');
    form.classList.add('review-form');
    form.setAttribute('id', 'form-reviews');

    //create title for form
    const formTitle = document.createElement('h4');
    formTitle.innerHTML = 'Add a Review';
    formTitle.classList.add('review-form-title');
    form.appendChild(formTitle);

    // create a name input field with a label
    const labelName = document.createElement('label');
    labelName.setAttribute('for', 'name');
    labelName.innerHTML = 'Name:';
    const nameInput = document.createElement('input');
    nameInput.setAttribute('id', 'name');
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('name', 'username');
    nameInput.setAttribute('placeholder', 'Enter your name');
    form.appendChild(labelName);
    form.appendChild(nameInput);

    // Create a rating select field
    const labelRating = document.createElement('label');
    labelRating.setAttribute('for', 'rating');
    labelRating.innerHTML = 'Rating:';
    const ratingSelect = document.createElement('select');
    ratingSelect.setAttribute('id', 'rating');
    const option = document.createElement('option');
    option.innerHTML = '--Please select a rating--';
    ratingSelect.appendChild(option);
    form.appendChild(labelRating);
    form.appendChild(ratingSelect);

    // Create options for the select
    for (let i = 0; i < 6; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.innerHTML = i;
      ratingSelect.appendChild(option);
    }

    // Create a textarea field with a label
    const labelComments = document.createElement('label');
    labelComments.setAttribute('for', 'comments');
    labelComments.innerHTML = 'Enter your Review:';
    const commentsArea = document.createElement('textarea');
    commentsArea.setAttribute('id', 'comments');
    commentsArea.setAttribute('name', 'commentstext');
    commentsArea.setAttribute('rows', '7');
    commentsArea.setAttribute('cols', '7');
    commentsArea.setAttribute('placeholder', 'Enter your comments');
    form.appendChild(labelComments);
    form.appendChild(commentsArea);

    // Create the buttons for the form
    const btnDiv = document.createElement('div');
    btnDiv.classList.add('form-btn-container');

    const btnSubmit = document.createElement('button');
    btnSubmit.innerHTML = 'Submit';
    btnSubmit.setAttribute('id', 'submit-review');
    btnDiv.appendChild(btnSubmit);

    const btnClose = document.createElement('button');
    btnClose.innerHTML = 'Cancel';
    btnClose.classList.add('close-review');
    btnClose.setAttribute('aria-label', 'Cancel and close form');
    btnClose.addEventListener('click', event => {
      event.preventDefault();
      const form = document.getElementById('form-reviews');
      form.reset();
      form.classList.toggle('hidden');
    });
    btnDiv.appendChild(btnClose);

    form.appendChild(btnDiv);

    container.appendChild(form);
  }
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Dynamically adjust the margin for maincontent based on header height
 */
adjustMaincontentMargin = () => {
  let headerHeight = document.querySelector('header').offsetHeight;
  document.querySelector('.detail').style.marginTop = headerHeight + 'px';
};

window.addEventListener('resize', () => {
  if (window.innerHeight >= 417) {
    adjustMaincontentMargin();
  } else {
    document.querySelector('.detail').style.marginTop = 95 + 'px';
  }
});

/**
 * Mark a restaurant as a favourite in db
 * if successsful css updated
 */
markAsFavourite = event => {
  event.target.classList.toggle('favourited');
  const id = event.target.getAttribute('data-rid');
  DBHelper.markFavourite(id);
};
