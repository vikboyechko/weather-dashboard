// set up variables for page elements
var searchInput = $('#search-input');
var searchButton = $('#search-button');
var resultsEl = $('.results');
var forecastEl = $('.forecast');
var resultsCityEl = $('.results-city');
var resultsIconEl = $('.results-icon');
var resultsTempEl = $('.results-temp');
var resultsWindEl = $('.results-wind');
var resultsHumidityEl = $('.results-humidity');

var WEATHER_API_KEY = 'ef0c4c7ee874fdcca867ed86f58db6b8';

resultsEl.hide(); // if no previous search exists, hide the current temp results section
forecastEl.hide(); // also hide the forecast section

// If local storage exists, get them, and initialize the last search, and populate previous cities searched
// if no local storage exists, initialize the last search and all searches items
if (!localStorage.getItem('lastSearch')) {
    localStorage.setItem('lastSearch', '');
}
if (!localStorage.getItem('allSearches')) {
    localStorage.setItem('allSearches', JSON.stringify([]));
}

// on website load, get the last searched city and call API for the forecast
var lastSearch = localStorage.getItem("lastSearch");
getCoords(lastSearch);

// gets the previous searched cities from local storage
function updateSearchHistory(searchedCity) {
    localStorage.setItem('lastSearch', searchedCity);
    var allSearches = JSON.parse(localStorage.getItem('allSearches'));
    if (!allSearches.includes(searchedCity)) {
        allSearches.unshift(searchedCity);
        localStorage.setItem('allSearches', JSON.stringify(allSearches));
        displayAllSearches();
    }
}

// show all previously searched cities below the search form
function displayAllSearches() {
    var allSearches = JSON.parse(localStorage.getItem('allSearches'));
    var listElement = $('#searched-cities');
    listElement.empty(); // Clear existing list items

    // if there is a previous search, show the city name(s)
    if (allSearches.length > 0) {
        listElement.text('Recent searches').css('font-style', 'italic');
        allSearches.forEach(function(city) {
            listElement.append('<li class="city-item">' + city + '</li>');
        });
        resultsEl.show(); // if previous search exists, now show the results elements
        forecastEl.show(); // and also show the forecast elements
    } else {
        listElement.text('');
        resultsEl.hide();
        forecastEl.hide();
    }
}
displayAllSearches(); // call the function

// the search button
searchButton.click(function(event) {
    event.preventDefault();
    var searchedCity = searchInput.val();
    getCoords(searchedCity);
});


// Function to first get latitude and longitude coordinates from zip or city search
function getCoords(searchInput) {

    var isZipCode = !isNaN(searchInput); // a zip code search gets a different result then city search

    // if search is a zip code. TO DO: limit search to 5 digits
    if (isZipCode) {
        var searchApiUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${searchInput},US&appid=${WEATHER_API_KEY}`;
        fetch(searchApiUrl, {
            method: 'GET',
    
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            var resultsCity = data.name;
            var resultsLat = data.lat;
            var resultsLon = data.lon;
            getForecast(resultsLat,resultsLon);
        })

    // if search is by city, return first result
    } else {
        var searchApiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${searchInput}&limit=1&appid=${WEATHER_API_KEY}`;
        fetch(searchApiUrl, {
            method: 'GET',
    
        })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            var resultsCity = data[0].name;
            var resultsLat = data[0].lat;
            var resultsLon = data[0].lon;
            getForecast(resultsLat,resultsLon);
        })
    }
}

// function to get the current weather and 5-day forecast from latitude and longitude
function getForecast(lat,lon) {
    var forecastUrl = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${WEATHER_API_KEY}`;

    fetch(forecastUrl, {
        method: 'GET',

    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        var today = dayjs().format(' (MM/DD/YYYY)'); // dayJS format for showing date
        var resultsCity = data.city.name;
        var resultsTemp = data.list[0].main.temp;
        var resultsWind = data.list[0].wind.speed;
        var resultsHumidity = data.list[0].main.humidity;
        var resultsWeatherIcon = data.list[0].weather[0].icon; // this is the weather icon
        var resultsWeatherIconUrl = `http://openweathermap.org/img/wn/${resultsWeatherIcon}.png`; // and this is the image url for the weather icon

        // Check if local storage exists, and if not, save to local storage, both the last search and the all search keys
        updateSearchHistory(resultsCity);

        // Populate the current weather
        resultsCityEl.text(resultsCity).append(today); // the city name and date for the current temp
        resultsIconEl.attr('src', resultsWeatherIconUrl); // the weather icon for the current temp
        resultsTempEl.text('Temp: ' + Math.trunc(resultsTemp) + '° F') ; // math trunc instead of rounding with math floor
        resultsWindEl.text('Wind: ' + Math.trunc(resultsWind) + ' mph');
        resultsHumidityEl.text('Humidity: ' + Math.trunc(resultsHumidity) + ' %');
        
        // Loop to populate each card
        // first get the data from the API
        for (var i = 1; i < 6; i++) {
            var forecastDate = dayjs().add(i, 'day').format('MM/DD/YYYY'); 
            var forecastTemp = data.list[i].main.temp;
            var forecastWind = data.list[i].wind.speed;
            var forecastHumidity = data.list[i].main.humidity;
            var forecastWeatherIcon = data.list[i].weather[0].icon;
            var forecastWeatherIconUrl = `http://openweathermap.org/img/wn/${forecastWeatherIcon}.png`

            // then populate the cards with the API data
            var dayContainer = $(`.day-container-${i}`);
            dayContainer.find('.day-date').text(forecastDate);
            dayContainer.find('.day-icon').attr('src', forecastWeatherIconUrl);
            dayContainer.find('.day-temp').text('Temp: ' + Math.trunc(forecastTemp) + '° F');
            dayContainer.find('.day-wind').text('Wind: ' + Math.trunc(forecastWind) + ' mph');
            dayContainer.find('.day-humidity').text('Humidity: ' + Math.trunc(forecastHumidity) + ' %');
        }
    })
}

// select a previously searched city to display its forecast, using the dynamically generated .city-item class
$('#searched-cities').on('click', '.city-item', function() {
    var city = $(this).text(); // use 'this' text as the city name to pass to getCoords function
    getCoords(city);
});


