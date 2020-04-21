"use strict";

/* Global variables */
let map;
const storesLayer = L.featureGroup(); // Used for additional icons on the map
const housesLayer = L.featureGroup();
const appartmentsLayer = L.featureGroup();
let satelliteLayer;

// Filter circle layers
let circlesLayer = L.geoJSON();

// List containing all point objects that go into the geojson of the circles
let featureList;

// Endpoint of the API
const endpoint = "http://127.0.0.1:5000/api/v1";

/* Keep opacity drops in mind */
const colors = {
    "--activiteiten-color": "#7CB5D2",
    "--faciliteiten-color": "#AC2324",
    "--gezondheidszorg-color": "#104577",
    "--horeca-color": "#BB94B7",
    "--onderwijs-color": "#18A68D",
    "--openbaar-vervoer-color": "#BDD74B",
    "--sport-color": "#96CEB7",
    "--toerisme-color": "#F8DFC8",
    "--transport-color": "#F68D51"
};

/* Default radiusses */
let radiusMapper = {
    'onderwijs': 5,
    'supermarkten': 5
}

const constructElements = function() {
    const propertyPanel = document.querySelector(".property-panel");
    const hamburgerIcon = document.querySelector(".hamburger-menu");
    const logo = document.querySelector(".logo");

    hamburgerIcon.addEventListener("click", () => {
        propertyPanel.classList.toggle("show");
        hamburgerIcon.classList.toggle("change");
        logo.classList.toggle("light-color");
    });
};

/* Adding overlay components */
const addMarker = function(latlng, label, layer, categoryID) {
    let marker = L.marker(latlng, {
        icon: createIconObject(`icons/${categoryID}.svg`, [20, 20], false)
    }).addTo(layer);
    marker.bindPopup(label);
};

const addCircle = function(latlng, categoryID, popupLabel) {
    const circle = {
        type: "Feature",
        properties: {
            category: categoryID,
            show_on_map: true,
            label: popupLabel
        },
        geometry: {
            type: "Point",
            coordinates: [latlng[1], latlng[0]]
        }
    };
    return circle;
};

const createIconObject = function(iconLocation, size, alignTop) {
    let myIcon = null;

    if (alignTop) {
        myIcon = L.icon({
            iconUrl: iconLocation,
            iconSize: size,
            iconAnchor: [size[0] * 0.5, 0], // From the top left, Centered on the bottom
            popupAnchor: [0, -size[1]] // From the anchor
        });
    } else {
        myIcon = L.icon({
            iconUrl: iconLocation,
            iconSize: size,
            iconAnchor: [size[0] * 0.5, size[1]], // From the top left, Centered on the bottom
            popupAnchor: [0, -size[1]] // From the anchor
        });
    }

    return myIcon;
};

const addIcon = function(
    iconLocation,
    latlng,
    layer,
    popupLabel,
    size,
    alignTop
) {
    const myIcon = createIconObject(iconLocation, size, alignTop);

    let marker = null;
    if (popupLabel) {
        marker = L.marker(latlng, {
            icon: myIcon,
            opacity: 0.8
        })
        .addTo(layer)
        .bindPopup(popupLabel);
    } else {
        marker = L.marker(latlng, {
            icon: myIcon
        }).addTo(layer);
    }

    return marker;
};

const addGeoJSON = function(jsonObject) {
    console.log(jsonObject);

    const addedGeoJson = L.geoJson(jsonObject, {
        pointToLayer: function(pointData, latlng) {
            const url = `icons/${pointData.properties.iconName}.png`;
            const popupLabel = pointData.properties.popupLabel;

            const icon = addIcon(url, latlng, housesLayer, popupLabel);

            // adds it to the geoJson object
            return icon;
        }
    });

    // Fit the view automatically to the contents of the geojson
    map.fitBounds(addedGeoJson.getBounds(), { padding: [40, 40] });
};

/* Creating the map */
const createMap = function() {
    const view = [50.6198455, 4.4796752];
    map = L.map("mapid", {'zoomControl': false}).setView(view, 8);

    const mapLayout = L.mapboxGL({
        attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        accessToken: "not-needed",
        style: `${endpoint}/get_map_style`
    }).addTo(map);

    map.options.minZoom = 8;
    map.options.maxZoom = 20;

    // Create layers
    storesLayer.addTo(map); // deze is voor laadpalen en fietsenstallingen enzo
    housesLayer.addTo(map);
    appartmentsLayer.addTo(map);

    // GeoJSON
    circlesLayer.addTo(map);

    // Scale
    L.control.scale({
        'position': 'bottomright',
        'updateWhenIdle': true,
        'imperial': false,
        'maxWidth': 150
    }).addTo(map);
    L.control.zoom({'position': 'bottomright'}).addTo(map);

    // Custom locations
    // const searchControl = L.esri.Geocoding.geosearch().addto(map);
};

const clearCircles = function() {
    circlesLayer.clearLayers();
    try {
        const svgElement = document.querySelector('g');
        svgElement.innerHTML = '';
    } catch {}
};

const showCurrentStores = function(jsonObject, zoomLevel) {
    console.log(Math.min(jsonObject.length, 1000), jsonObject.length);
    // Clear all icons / circles on the map
    storesLayer.clearLayers();
    clearCircles();

    // Sort so charging stations are drawn before bicycle parkings
    jsonObject.sort((a, b) => a.value < b.value);
    // Clear list of features
    featureList = [];

    // Initialize list to store locations to avoid overlap
    let icon_lats = [];
    let icon_longs = [];
    let circle_lats = [];
    let circle_longs = [];

    // Initialize index
    let i = 0;

    // keep adding circles untill we hit the maximum amount of locations visible, or the treshold
    while(circle_lats.length <= Math.min(jsonObject.length, 2000)) {
        const store = jsonObject[i];
        let store_lat = store.lat;
        let store_long = store.lng;

        if (zoomLevel >= 18) {
            // Consider drawing additional icons
            if (
                store.isVisible === 1 &&
                !icon_lats.includes(store_lat) &&
                !icon_longs.includes(store_long)
            ) {
                const url = `icons/${store.value}.svg`;
                let size = [13, 13];
                addIcon(url, [store_lat, store_long], storesLayer, null, size, 0.75, 0);

                const textUrl = `icons/${store.value}_text.svg`;
                if (zoomLevel > 18) {
                    // add label
                    if (store.value === "bicycle_parking" || store.value === "charging_station") {
                        addIcon(textUrl, [store_lat+0.000004, store_long], storesLayer, null, [74*1.2, 20*1.2], 1, 1);
                    }
                }

                // Store location so we dont overlap 2 icons
                icon_lats.push(store_lat);
                icon_longs.push(store_long);
            }
        }

        // Draw circles around location,
        // Drop some precission to avoid more overlap and increase usability
        if (
            // No 2 circles on the same place
            !circle_lats.includes(store_lat) &&
            !circle_longs.includes(store_long)
        ) {

            // Fetch category of the current location
            let categoryID = store.category.replace(" ", "-").toLowerCase();
            categoryID = categoryID === 'bezienswaardigheden' ? 'activiteiten' : categoryID;
            
            // Generate GeoJSON object
            featureList.push(addCircle([store_lat, store_long], categoryID, store.label));

            // Add location to the known coords
            circle_lats.push(store_lat);
            circle_longs.push(store_long);
        }

        /*
        if (zoomLevel >= 14) {
            // Fetch category of the current location
            let categoryID = store.category.replace(" ", "-").toLowerCase();
            categoryID = categoryID === 'bezienswaardigheden' ? 'activiteiten' : categoryID;

            // Generate marker
            addIcon(`icons/${categoryID}.svg`, [store_lat, store_long], storesLayer, store.label, [20,20], true);
        }
        */

        // Quit loop when the end of the locations list is reached
        if (i < jsonObject.length - 1) {
            // Increment the index
            i++;
        }   else {
            break;
        }
    }

    // Draw the circles
    circlesLayer.removeFrom(map);
    circlesLayer = L.geoJson(featureList, {
        pointToLayer: function(pointData, latlng) {
            const category = pointData.properties.category;
            return L.circle(latlng, {
                radius: radiusMapper[category] * 100,
                fillColor: colors[`--${category}-color`],
                stroke: false,
                fillOpacity: 0.3
            }).bindPopup(pointData.properties.label);
        }
    }).addTo(map);

    /*
    // Get all of the generated svg paths
    const svgElement = document.querySelector('g');
    const parent = svgElement.parentElement;
    const paths = svgElement.querySelectorAll('path');

    let htmlStringPaths = '';
    for (const path of paths) {
        htmlStringPaths += `<path d="${path.getAttribute('d')}"></path>`;
    }

    const viewBox = parent.getAttribute('viewBox').split(" ");
    svgElement.innerHTML= `
    <mask id="myMask">
    <rect x="${viewBox[0]}" y="${viewBox[1]}" width="${viewBox[2]}" height="${viewBox[3]}" fill="#fff" />
    ${htmlStringPaths}
    </mask>
    <rect x="${viewBox[0]}" y="${viewBox[1]}" width="${viewBox[2]}" height="${viewBox[3]}" fill="rgba(184, 15, 10, 0.2)" mask="url(#myMask)" />
    `;
    */

};

const showCategories = function(jsonObject) {
    const htmlCategories = document.querySelector(".js-categories");
    let htmlString = "";

    for (const category of jsonObject) {
        const categoryName =
            category.name === "Bezienswaardigheden"
                ? "Activiteiten"
                : category.name;
        const categoryDescription = category.description;
        const categoryCount = category.amount;

        const categoryID = categoryName.replace(" ", "-").toLowerCase();
        htmlString += `
        <li class="filter-item o-list-item o-layout">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" class="arrow-icon" id="${categoryID}_icon"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
            <p class="filter-link" id="${categoryID}">${categoryName}</p>
        </li>
        `;

        // Description
        htmlString += `<p class="small-width light-text filter-text u-hidden ${categoryID}">${categoryDescription} (${categoryCount})</p>`;

        // Slider
        htmlString += `
        <div class="slidecontainer u-hidden ${categoryID}">
            <input type="range" min="0.1" max="10" value="5" step="0.1" class="slider slider__location slider--${categoryID}" id="${categoryID}_range">
        </div>
        `;
    }

    htmlCategories.innerHTML = htmlString;

    // add event listeners for the categories
    for (const htmlCategory of document.querySelectorAll(".filter-link")) {
        const arrowObject = document.querySelector(
            `#${htmlCategory.getAttribute("id")}_icon`
        );

        htmlCategory.addEventListener("click", function() {
            arrowObject.classList.toggle("show__icon--open");
            this.classList.toggle("filter-link__scale");
            for (const val of document.querySelectorAll(
                `.${htmlCategory.getAttribute("id")}`
            )) {
                val.classList.toggle("u-hidden");
            }
        });
    }

    // add event listeners for the sliders
    for (const slider of document.querySelectorAll(".slider__location")) {
        slider.addEventListener("input", function() {
            let categoryID = this.getAttribute("id").split("_range")[0];
            categoryID = categoryID === "Bezienswaardigheden"
                ? "Activiteiten"
                : categoryID;
            radiusMapper[categoryID] = this.value;

            circlesLayer.removeFrom(map);
            circlesLayer = L.geoJson(featureList, {
                pointToLayer: function(pointData, latlng) {
                    const category = pointData.properties.category;
                    return L.circle(latlng, {
                        radius: radiusMapper[category] * 100,
                        fillColor: colors[`--${category}-color`],
                        stroke: false,
                        fillOpacity: 0.3
                    });
                }
            }).addTo(map);
        });
    }
};

const getCategories = function() {
    handleData(endpoint + "/osm/categories", showCategories);
};

const trackUser = function() {
    map.on("moveend", function(e) {
        const zoomLevel = e.target._animateToZoom;

        const viewBounds = map.getBounds();
        // Grow the bounds a bit to include locations that are just outside,
        // but their perimeter still reaches inside the current view
        const biggestRadius = Math.max.apply(null, Object.values(radiusMapper)) * 0.001;

        let minLat = String(viewBounds._southWest.lat - biggestRadius).replace(".", "-");
        let maxLat = String(viewBounds._northEast.lat + biggestRadius).replace(".", "-");
        let minLong = String(viewBounds._southWest.lng - biggestRadius).replace(".", "-");
        let maxLong = String(viewBounds._northEast.lng + biggestRadius).replace(".", "-");

        if (zoomLevel >= 11) {
            // display stores and such
            console.log('going to backend');
            handleData(
                `${endpoint}/osm/${minLat}~${maxLat}~${minLong}~${maxLong}`,
                function(jsonObject) {
                    showCurrentStores(jsonObject, zoomLevel);
                }
            );
        } else {
            clearCircles();
            storesLayer.clearLayers();
        }
    });
};

/* init */
const init = function() {
    console.log("DOM Content Loaded");

    // Define map stuff
    createMap();

    // Construct navigation and other static elements
    constructElements();

    // Getting categories
    getCategories();

    // Track user
    trackUser();
};

document.addEventListener("DOMContentLoaded", init);
