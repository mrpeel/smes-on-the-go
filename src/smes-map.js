/** SMESGMap class encapsulating the maps functionality required to load a map with custom controls,
    set-up markers and and infor windows
*/

/*global Promise, google, document, navigator, console, MapLabel, InfoBox, window*/

/** 
 */
var SMESGMap = function (elementId, options) {
    "use strict";

    var smesGMap = this;
    var mapState = this.getMapState() || {};
    var mapCenter, pixelVerticalOffSet;

    if (mapState.lat && mapState.lng) {
        mapCenter = new google.maps.LatLng(mapState.lat, mapState.lng);
    } else {
        //default to centre of melbourne if nothing saved
        mapCenter = new google.maps.LatLng(-37.813942, 144.9711861);
    }


    smesGMap.setupMapStyles();
    smesGMap.mapStyleName = mapState.mapStyleName || "iovation";

    options = options || {};

    options.mapOptions = options.mapOptions || {
        center: mapCenter,
        zoom: mapState.zoom || 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,

        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        scaleControl: true,
        streetViewControl: false,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        panControl: false,
        rotateControl: false,
        styles: this.mapStyles[this.mapStyleName]
    };

    smesGMap.mapOptions = options.mapOptions;

    smesGMap.markers = [];
    smesGMap.labels = [];
    smesGMap.markerIcons = [];
    smesGMap.pixelDensity = 1;
    //Special offsets for IOS and mobile safari
    smesGMap.pixelVerticalOffSet = options.pixelVerticalOffSet || 0;
    smesGMap.mobile = options.mobile || false;

    smesGMap.map = new google.maps.Map(document.getElementById(elementId), smesGMap.mapOptions);
    smesGMap.geocoder = new google.maps.Geocoder();
    smesGMap.infoWindow = new google.maps.InfoWindow();
    smesGMap.infoBox = new InfoBox({
        content: document.getElementById("infobox"),
        disableAutoPan: false,
        maxWidth: 440,
        pixelOffset: new google.maps.Size(-220, smesGMap.pixelVerticalOffSet),
        zIndex: 25,
        closeBoxURL: "",
        infoBoxClearance: new google.maps.Size(4, 4)
    });

    //Set-up the correct zoom level and icon size
    smesGMap.setZoomLevel();

    google.maps.event.addListener(smesGMap.map, 'zoom_changed', function () {
        smesGMap.setZoomLevel();
    });


    if (typeof options.zoomChanged === "function") {
        google.maps.event.addListener(smesGMap.map, 'zoom_changed', function (e) {
            if (e === undefined) {
                e = smesGMap;
            }

            options.zoomChanged.apply(smesGMap, [e]);

        });

    }


    google.maps.event.addListener(smesGMap.map, 'idle', function () {
        smesGMap.checkSizeofMap();
        smesGMap.refreshMarkers();
        smesGMap.saveMapState();
    });


    if (typeof options.idle === "function") {
        google.maps.event.addListener(smesGMap.map, 'idle', function (e) {
            if (e === undefined) {
                e = smesGMap;
            }

            options.idle.apply(smesGMap, [e]);

        });

    }

    /* Enable custom styling when the infobox is displayed*/
    var lInfoBox = smesGMap.infoBox;
    google.maps.event.addListener(lInfoBox, 'domready', function () {
        var closeButt = document.getElementById("close-info-box");

        if (closeButt) {
            closeButt.addEventListener("click", function () {
                lInfoBox.setVisible(false);
                smesGMap.resetSelectedMarker();

                if (typeof options.closeInfobox === "function") {
                    options.closeInfobox.apply(smesGMap);
                }

            });

        }
    });


    //Make sure infobox is correct size
    smesGMap.resizeInfoBox();

    //Set-up resizing
    window.onresize = smesGMap.resizeInfoBox();

    console.log(smesGMap.pixelVerticalOffSet);

};

SMESGMap.prototype.resizeInfoBox = function () {
    "use strict";

    var smesGMap = this;
    var windowWidth = window.innerWidth;
    var currentBoxWidth = smesGMap.infoBox.maxWidth_;

    if ((windowWidth < 440 || currentBoxWidth < 440) && windowWidth !== currentBoxWidth) {
        if (windowWidth > 440) {
            windowWidth = 440;
        }

        smesGMap.infoBox.setOptions({
            maxWidth: windowWidth,
            pixelOffset: new google.maps.Size(windowWidth * -0.5, smesGMap.pixelVerticalOffSet)
        });

    }

};

SMESGMap.prototype.getMapState = function () {
    "use strict";

    var smesGMap = this;
    var mapState = {};


    if (!window.localStorage) {
        return mapState;
    }

    mapState = JSON.parse(window.localStorage.getItem('map-state')) || {};

    return mapState;

};

SMESGMap.prototype.saveMapState = function () {
    "use strict";

    var smesGMap = this;
    var mapState = {};
    var mapCoords = smesGMap.getMapPosition();

    mapState.zoom = smesGMap.getZoom();
    //Never save a zoom state greater than 18 - it complicates loading of labels
    if (mapState.zoom > 18) {
        mapState.zoom = 18;
    }
    mapState.mapStyleName = smesGMap.mapStyleName;
    mapState.lat = mapCoords.lat;
    mapState.lng = mapCoords.lng;

    if (!window.localStorage) {
        return;
    }


    try {
        window.localStorage.setItem('map-state', JSON.stringify(mapState));
    } catch (e) {
        //Give up
        console.log("Write to local storage failed");
    }

};

SMESGMap.prototype.geoLocate = function () {
    "use strict";

    var smesGMap = this;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                var geoPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                smesGMap.map.setCenter(geoPosition);
            },
            function (error) {
                console.log(error);
            });
    }

};

SMESGMap.prototype.getMapPosition = function () {
    "use strict";

    var smesGMap = this;
    var mapCenter = smesGMap.map.getCenter();
    var position = {};

    position.lat = mapCenter.lat();
    position.lng = mapCenter.lng();

    return position;
};


SMESGMap.prototype.getZoom = function () {
    "use strict";

    var smesGMap = this;

    return smesGMap.map.getZoom();

};

/**
 * 
 * @param {None}.
 * @return {None}.
 */

SMESGMap.prototype.addMarker = function (marker, loadHidden) {
    "use strict";

    //Capture local reference of map for use in click functions
    var smesGMap = this;
    var markerLat, markerLng, markerTitle, markerIcon, nineFigureNo, infoWindowContent, eventListeners, mapReference;

    markerLat = marker.lat;
    markerLng = marker.lng;
    markerTitle = marker.title;
    markerIcon = marker.icon;
    nineFigureNo = marker.nineFigureNo;
    infoWindowContent = marker.infoWindowContent;
    eventListeners = marker.eventListeners || null;

    //Check whether marker should be visible on the map or not, only set the mapReference if markers are being displayed
    if (smesGMap.markersVisible && !loadHidden) {
        mapReference = smesGMap.map;
    }

    var icon = {
        url: markerIcon + ".png",
        size: new google.maps.Size(smesGMap.markerSize * smesGMap.pixelDensity, smesGMap.markerSize * smesGMap.pixelDensity),
        scaledSize: new google.maps.Size(smesGMap.markerSize, smesGMap.markerSize)
    };


    var mapMarker = new google.maps.Marker({
        position: new google.maps.LatLng(markerLat, markerLng),
        title: markerTitle,
        map: mapReference,
        draggable: false,
        icon: icon,
        animation: google.maps.Animation.DROP,
        infoContent: infoWindowContent,
        nineFigureNo: nineFigureNo,
    });



    mapMarker.addListener('click', function () {
        //smesGMap.infoWindow.setContent(mapMarker.infoContent); //infoWindowContent);
        //smesGMap.infoWindow.open(smesGMap.map, this);
        var infoBoxEl = document.getElementById("infobox");
        infoBoxEl.innerHTML = mapMarker.infoContent;
        smesGMap.setSelectedMarker(mapMarker);
        smesGMap.infoBox.open(smesGMap.map, this);
        smesGMap.infoBox.setVisible(true);
        smesGMap.map.panTo(mapMarker.position);

        //Mobile apps need extra panning - safari needs extra panning to account for their shitty, idiotic  nav bar at the bottom of the viewport
        if (smesGMap.mobile !== "") {
            var pixelPan = 10;

            if (smesGMap.mobile === "iOSSafari") {
                pixelPan = 25 * 4 / window.devicePixelRatio;
            }
            window.setTimeout(function () {
                smesGMap.map.panBy(0, pixelPan);
            }, 10);
        }


        if (eventListeners && eventListeners.click) {
            eventListeners.click.apply();
        }

        //Make sure that this doesn't fire before the rendering has completed
        if (eventListeners && eventListeners.domready) {
            window.setTimeout(function () {
                eventListeners.domready.apply(this);
            }, 0);
        }


    });


    smesGMap.markers.push(mapMarker);

    //If labels are being displayed, add the label as well
    if (smesGMap.labelsVisible) {
        //Create label and add to nmap
        var label = {};
        label.position = mapMarker.position;
        label.label = mapMarker.title;
        label.nineFigureNo = mapMarker.nineFigureNo;
        smesGMap.addLabel(label);
    }

};


SMESGMap.prototype.updateMarker = function (marker) {
    "use strict";

    //Capture local reference of map for use in click functions
    var smesGMap = this;

    var markerLat, markerLng, markerTitle, markerIcon, nineFigureNo, infoWindowContent, eventListeners;
    var mapMarker, icon;

    markerLat = marker.lat;
    markerLng = marker.lng;
    markerTitle = marker.title;
    markerIcon = marker.icon;
    nineFigureNo = marker.nineFigureNo;
    infoWindowContent = marker.infoWindowContent;


    for (var i = 0; i < smesGMap.markers.length; i++) {
        if (smesGMap.markers[i].nineFigureNo === nineFigureNo) {
            mapMarker = smesGMap.markers[i];
            break;
        }
    }

    //If a marker was found and defined continue processing
    if (mapMarker) {
        icon = {
            url: markerIcon + ".png",
            size: new google.maps.Size(smesGMap.markerSize * smesGMap.pixelDensity, smesGMap.markerSize * smesGMap.pixelDensity),
            scaledSize: new google.maps.Size(smesGMap.markerSize, smesGMap.markerSize)
        };

        mapMarker.setIcon(icon);
        mapMarker.setPosition(new google.maps.LatLng(markerLat, markerLng));
        mapMarker.setTitle(markerTitle);
        mapMarker.infoContent = infoWindowContent;
    }

    for (var j = 0; j < smesGMap.markers.length; j++) {
        if (smesGMap.markers[j].nineFigureNo === nineFigureNo) {
            smesGMap.markers.splice(j, 1);
            break;
        }
    }

};

SMESGMap.prototype.setSelectedMarker = function (marker) {
    "use strict";

    var smesGMap = this;
    var icon = marker.icon;
    var url = icon.url;
    var newSize;

    smesGMap.resetSelectedMarker();

    //Ensure that the shadow version isn't already referenced
    url = url.replace("selected-", "");

    var lastSlash = url.lastIndexOf("/");

    url = url.substr(0, lastSlash + 1) + "selected-" + url.substr(lastSlash + 1);

    newSize = smesGMap.markerSize * 2;
    icon.scaledSize = new google.maps.Size(newSize, newSize);
    icon.size = new google.maps.Size(newSize * smesGMap.pixelDensity, newSize * smesGMap.pixelDensity);
    icon.url = url;

    marker.zIndex = 100;
    marker.setIcon(icon);
    marker.isSelected = true;
};

SMESGMap.prototype.resetSelectedMarker = function () {
    "use strict";

    var smesGMap = this;
    var icon, url;

    for (var i = 0; i < smesGMap.markers.length; i++) {

        //Check if icon is larger and reset as necessary
        if (smesGMap.markers[i].isSelected) {
            icon = smesGMap.markers[i].icon;
            url = icon.url;

            //Ensure that the shadow version isn't referenced anymore for image
            url = url.replace("selected-", "");

            icon.scaledSize = new google.maps.Size(smesGMap.markerSize, smesGMap.markerSize);
            icon.size = new google.maps.Size(smesGMap.markerSize * smesGMap.pixelDensity, smesGMap.markerSize * smesGMap.pixelDensity);
            icon.url = url;

            smesGMap.markers[i].setIcon(icon);
            delete smesGMap.markers[i].isSelected;
        }
    }

};

SMESGMap.prototype.addLabel = function (label) {
    "use strict";

    var smesGMap = this;

    var mapLabel = new MapLabel({
        text: label.label,
        position: label.position,
        map: smesGMap.map,
        fontFamily: "Sans-Serif", //'Roboto', 'Helvetica', sans-serif",
        strokeWeight: 2,
        fontColor: '#193e69',
        strokeColor: '#FFF',
        fontSize: 13,
        align: 'center',
        nineFigureNo: label.nineFigureNo
    });

    smesGMap.labels.push(mapLabel);


};


SMESGMap.prototype.setZoomLevel = function () {
    "use strict";

    var smesGMap = this;
    var zoomLevel = smesGMap.map.getZoom();

    if (zoomLevel < 14) {
        smesGMap.markersVisible = false;
    } else if (zoomLevel >= 14) {
        smesGMap.markersVisible = true;
    }

    if (zoomLevel >= 19) {
        smesGMap.labelsVisible = true;
    } else {
        smesGMap.labelsVisible = false;
    }


    //Reset zoomLevel
    smesGMap.zoomLevel = smesGMap.map.getZoom();
    smesGMap.markerSize = 9 + ((smesGMap.zoomLevel - 14) * 1.75);

};


SMESGMap.prototype.clearLabels = function () {
    "use strict";

    var smesGMap = this;

    //Disconnect labels from the map
    for (var i = 0; i < smesGMap.labels.length; i++) {
        smesGMap.labels[i].setMap(null);
    }

    //Truncate the labels array
    smesGMap.labels.length = 0;
};


SMESGMap.prototype.refreshMarkers = function () {
    "use strict";

    var icon, newSize, position;
    var smesGMap = this;
    var bounds = smesGMap.map.getBounds();

    //Start by clearing all labels
    smesGMap.clearLabels();

    //Loop through the markers
    for (var markerCounter = 0; markerCounter < smesGMap.markers.length || 0; markerCounter++) {
        position = smesGMap.markers[markerCounter].position;

        //Check if all markers are hidden or markers is outside current viewport
        if (!smesGMap.markersVisible || !bounds.contains(position)) {
            //No need to display marker
            smesGMap.markers[markerCounter].setMap(null);
        } else {
            //Retrieve the marker icon and re-set its size
            icon = smesGMap.markers[markerCounter].icon;
            newSize = smesGMap.markerSize || 14;

            if (smesGMap.markers[markerCounter].isSelected) {
                newSize = newSize * 2;
            }

            //Check if marker icon size has changed
            if (newSize != icon.size.width) {
                icon.scaledSize = new google.maps.Size(newSize, newSize);
                icon.size = new google.maps.Size(newSize * smesGMap.pixelDensity, newSize * smesGMap.pixelDensity);

                //Update icon
                smesGMap.markers[markerCounter].setIcon(icon);
            }

            //Make sure markers is being displayed on the map
            if (!smesGMap.markers[markerCounter].map) {
                smesGMap.markers[markerCounter].setMap(smesGMap.map);
            }

            //Check whether the labels are being displayed, if so add to map
            if (smesGMap.labelsVisible) {
                //Create label and add to nmap
                var label = {};
                label.position = position;
                label.label = smesGMap.markers[markerCounter].title;
                label.nineFigureNo = smesGMap.markers[markerCounter].nineFigureNo;
                smesGMap.addLabel(label);
            }
        }

    }

};

SMESGMap.prototype.reverseGeocode = function (cLat, cLng) {
    "use strict";

    var smesGMap = this;

    return new Promise(function (resolve, reject) {

        var latLng = {
            lat: cLat,
            lng: cLng
        };

        smesGMap.geocoder.geocode({
            'location': latLng
        }, function (results, status) {

            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    //Remove Australia from the returned string
                    var address = results[0].formatted_address.replace(", Australia", "");
                    //Remove VIC and post code from the end of the string
                    var vPos = address.indexOf("VIC ");
                    if (vPos > 0) {
                        address = address.substr(0, vPos - 1);
                    }
                    resolve(address);
                } else {
                    resolve("");
                }
            } else {
                console.log('Geocoder failed due to: ' + status);
                reject('Geocoder failed due to: ' + status);
            }
        });
    });
};

SMESGMap.prototype.setUpAutoComplete = function (elementId, clearButtonId) {
    "use strict";

    var smesGMap = this;
    var input = document.getElementById(elementId);
    var searchInfoWindow = new google.maps.InfoWindow();
    var clearButton = document.getElementById(clearButtonId);

    var searchMarker = new google.maps.Marker({
        map: smesGMap.map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    smesGMap.autoComplete = new google.maps.places.Autocomplete(input);
    smesGMap.autoComplete.bindTo('bounds', smesGMap.map);

    input.addEventListener('input', function () {
        input.classList.remove("not-found");
        if (input.value === "") {
            clearButton.classList.add("hidden");
        } else {
            clearButton.classList.remove("hidden");
        }

    });


    smesGMap.autoComplete.addListener('place_changed', function () {
        searchInfoWindow.close();
        searchMarker.setVisible(false);
        var place = smesGMap.autoComplete.getPlace();

        if (!place.geometry) {
            input.classList.add("not-found");
            return;
        }

        input.classList.remove("not-found");

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            smesGMap.map.fitBounds(place.geometry.viewport);
        } else {
            smesGMap.map.setZoom(17); // Why 17? Because it will likely be close enough to load marks.
            smesGMap.map.setCenter(place.geometry.location);
        }

        //Add map icon
        searchMarker.setPosition(place.geometry.location);
        searchMarker.setVisible(true);

        var address = '';
        if (place.address_components) {
            address = [
                (place.address_components[0] && place.address_components[0].short_name || ''),
                (place.address_components[1] && place.address_components[1].short_name || ''),
                (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
        }

        searchInfoWindow.setContent('<div><strong>' + place.name + '</strong><br>' + address + '</div>');
        searchInfoWindow.open(smesGMap.map, searchMarker);

    });

    searchMarker.addListener('click', function () {
        searchInfoWindow.open(smesGMap.map, searchMarker);
    });

};



SMESGMap.prototype.checkSizeofMap = function () {
    "use strict";

    var smesGMap = this;

    var mapCenter = smesGMap.map.getCenter();
    var mapBoundsSouthWest = smesGMap.map.getBounds().getSouthWest();


    if (typeof mapBoundsSouthWest !== 'undefined' && typeof mapCenter !== 'undefined') {
        var mapRadius = smesGMap.getDistanceKms(mapCenter.lat(), mapCenter.lng(), mapBoundsSouthWest.lat(), mapBoundsSouthWest.lng());

        smesGMap.mapSize = (mapRadius / 1000);
    } else {
        smesGMap.mapSize = 0;
    }

    return smesGMap.mapSize;

};

/**
 * Calculate the distance between two points in kilometres
 * @params {number} - coordinate values in latitude and longitude for the two points
 */
SMESGMap.prototype.getDistanceKms = function (point1Lat, point1Lng, point2Lat, point2Lng) {
    "use strict";

    var smesGMap = this;
    var R = 6378137; // Earth’s mean radius
    var dLat = smesGMap.calcRad(point2Lat - point1Lat);
    var dLong = smesGMap.calcRad(point2Lng - point1Lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(smesGMap.calcRad(point1Lat)) * Math.cos(smesGMap.calcRad(point2Lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d; // returns the distance in metres
};

/**
 * Calculate radians for a given value
 * @params {number} x - the input value
 */
SMESGMap.prototype.calcRad = function (x) {
    "use strict";

    return x * Math.PI / 180;
};

SMESGMap.prototype.changeMapStyle = function (styleName) {
    "use strict";

    var smesGMap = this;
    var styleDetails;

    smesGMap.mapStyleName = styleName;

    if (styleName !== "google" && smesGMap.mapStyles[styleName]) {
        styleDetails = smesGMap.mapStyles[styleName];
    }

    smesGMap.map.setOptions({
        styles: styleDetails
    });

};

/**
  Map stlyes for use with Google maps
**/
SMESGMap.prototype.setupMapStyles = function () {
    "use strict";

    var smesGMap = this;

    smesGMap.mapStyles = {
        coolgrey: [{
            "featureType": "landscape",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
                }]
            }, {
            "featureType": "transit",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
                }]
            }, {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
                }]
            }, {
            "featureType": "water",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
                }]
            }, {
            "featureType": "road",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
                }]
            }, {
            "stylers": [{
                "hue": "#00aaff"
            }, {
                "saturation": -100
            }, {
                "gamma": 2.15
            }, {
                "lightness": 12
                }]
            }, {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{
                "visibility": "on"
            }, {
                "lightness": 24
                }]
            }, {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{
                "lightness": 57
                }]
            }],

        darkgrey: [
            {
                "featureType": "landscape",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "lightness": 65
            },
                    {
                        "visibility": "on"
            }
        ]
    },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "lightness": 51
            },
                    {
                        "visibility": "simplified"
            }
        ]
    },
            {
                "featureType": "road.highway",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "visibility": "simplified"
            }
        ]
    },
            {
                "featureType": "road.arterial",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "lightness": 30
            },
                    {
                        "visibility": "on"
            }
        ]
    },
            {
                "featureType": "road.local",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "lightness": 40
            },
                    {
                        "visibility": "on"
            }
        ]
    },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "saturation": -100
            },
                    {
                        "visibility": "simplified"
            }
        ]
    },
            {
                "featureType": "administrative.province",
                "stylers": [
                    {
                        "visibility": "off"
            }
        ]
    },
            {
                "featureType": "water",
                "elementType": "labels",
                "stylers": [
                    {
                        "visibility": "on"
            },
                    {
                        "lightness": -25
            },
                    {
                        "saturation": -100
            }
        ]
    },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "hue": "#ffff00"
            },
                    {
                        "lightness": -25
            },
                    {
                        "saturation": -97
            }
        ]
    }
],

        paledawn: [{
            "featureType": "administrative",
            "elementType": "all",
            "stylers": [{
                "visibility": "on"
    }, {
                "lightness": 33
    }]
}, {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{
                "color": "#f2e5d4"
    }]
}, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#c5dac6"
    }]
}, {
            "featureType": "poi.park",
            "elementType": "labels",
            "stylers": [{
                "visibility": "on"
    }, {
                "lightness": 20
    }]
}, {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{
                "lightness": 20
    }]
}, {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{
                "color": "#c5c6c6"
    }]
}, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e4d7c6"
    }]
}, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#fbfaf7"
    }]
}, {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{
                "visibility": "on"
    }, {
                "color": "#acbcc9"
    }]
}],

        shiftworker: [{
            "stylers": [{
                "saturation": -100
    }, {
                "gamma": 1
    }]
}, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "poi.business",
            "elementType": "labels.text",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "poi.business",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "poi.place_of_worship",
            "elementType": "labels.text",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "poi.place_of_worship",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }]
}, {
            "featureType": "water",
            "stylers": [{
                "visibility": "on"
    }, {
                "saturation": 50
    }, {
                "gamma": 0
    }, {
                "hue": "#50a5d1"
    }]
}, {
            "featureType": "administrative.neighborhood",
            "elementType": "labels.text.fill",
            "stylers": [{
                "color": "#333333"
    }]
}, {
            "featureType": "road.local",
            "elementType": "labels.text",
            "stylers": [{
                "weight": 0.5
    }, {
                "color": "#333333"
    }]
}, {
            "featureType": "transit.station",
            "elementType": "labels.icon",
            "stylers": [{
                "gamma": 1
    }, {
                "saturation": 50
    }]
}],

        simplelight: [{
            "featureType": "administrative",
            "elementType": "all",
            "stylers": [{
                "visibility": "simplified"
    }]
}, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#fcfcfc"
    }]
}, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#fcfcfc"
    }]
}, {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#dddddd"
    }]
}, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#dddddd"
    }]
}, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#eeeeee"
    }]
}, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "color": "#dddddd"
    }]
}],

        muted: [{
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [{
                "color": "#444444"
    }]
}, {
            "featureType": "administrative.locality",
            "elementType": "labels",
            "stylers": [{
                "visibility": "on"
    }]
}, {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{
                "color": "#f2f2f2"
    }, {
                "visibility": "simplified"
    }]
}, {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{
                "visibility": "on"
    }]
}, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "saturation": "-65"
    }, {
                "lightness": "45"
    }, {
                "gamma": "1.78"
    }]
}, {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "poi",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{
                "saturation": -100
    }, {
                "lightness": 45
    }]
}, {
            "featureType": "road",
            "elementType": "labels",
            "stylers": [{
                "visibility": "on"
    }]
}, {
            "featureType": "road",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [{
                "visibility": "simplified"
    }]
}, {
            "featureType": "road.highway",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [{
                "saturation": "-33"
    }, {
                "lightness": "22"
    }, {
                "gamma": "2.08"
    }]
}, {
            "featureType": "transit.station.airport",
            "elementType": "geometry",
            "stylers": [{
                "gamma": "2.08"
    }, {
                "hue": "#ffa200"
    }]
}, {
            "featureType": "transit.station.airport",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "transit.station.rail",
            "elementType": "labels.text",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "transit.station.rail",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "simplified"
    }, {
                "saturation": "-55"
    }, {
                "lightness": "-2"
    }, {
                "gamma": "1.88"
    }, {
                "hue": "#ffab00"
    }]
}, {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{
                "color": "#bbd9e5"
    }, {
                "visibility": "simplified"
    }]
}],

        iovation: [{
            "featureType": "all",
            "elementType": "geometry",
            "stylers": [{
                "gamma": "0.82"
    }]
}, {
            "featureType": "all",
            "elementType": "geometry.fill",
            "stylers": [{
                "gamma": "1.21"
    }]
}, {
            "featureType": "all",
            "elementType": "labels",
            "stylers": [{
                "lightness": "-60"
    }]
}, {
            "featureType": "all",
            "elementType": "labels.text",
            "stylers": [{
                "gamma": "5.37"
    }]
}, {
            "featureType": "all",
            "elementType": "labels.text.fill",
            "stylers": [{
                "color": "#419d8c"
    }, {
                "lightness": "-39"
    }]
}, {
            "featureType": "all",
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
    }, {
                "color": "#ffffff"
    }, {
                "lightness": 16
    }]
}, {
            "featureType": "all",
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
    }]
}, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
    }, {
                "lightness": 20
    }]
}, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
    }, {
                "lightness": 17
    }, {
                "weight": 1.2
    }]
}, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
    }, {
                "lightness": 20
    }]
}, {
            "featureType": "landscape.natural",
            "elementType": "geometry.fill",
            "stylers": [{
                "saturation": "0"
    }]
}, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
    }, {
                "lightness": 21
    }]
}, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
    }, {
                "lightness": 21
    }]
}, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
    }, {
                "lightness": 17
    }]
}, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
    }, {
                "lightness": 29
    }, {
                "weight": 0.2
    }]
}, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
    }, {
                "lightness": 18
    }]
}, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
    }, {
                "lightness": 16
    }]
}, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
    }, {
                "lightness": 19
    }]
}, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
    }, {
                "lightness": 17
    }]
}, {
            "featureType": "water",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#42738d"
    }, {
                "gamma": "5.37"
    }]
}],
        ultralight: [{
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "color": "#e9e9e9"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 17
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 29
            }, {
                "weight": 0.2
            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 18
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f5f5f5"
            }, {
                "lightness": 21
            }]
        }, {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{
                "color": "#dedede"
            }, {
                "lightness": 21
            }]
        }, {
            "elementType": "labels.text.stroke",
            "stylers": [{
                "visibility": "on"
            }, {
                "color": "#ffffff"
            }, {
                "lightness": 16
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{
                "saturation": 36
            }, {
                "color": "#333333"
            }, {
                "lightness": 40
            }]
        }, {
            "elementType": "labels.icon",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{
                "color": "#f2f2f2"
            }, {
                "lightness": 19
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{
                "color": "#fefefe"
            }, {
                "lightness": 17
            }, {
                "weight": 1.2
            }]
        }]
    };

};
