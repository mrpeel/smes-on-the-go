var coolGrey = [{
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
}];

var darkGrey = [
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
];

var paleDawn = [{
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
}];

var shiftWorker = [{
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
}];

var simpleLight = [{
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
}];

var muted = [{
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
}];

var iovation = [{
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
}];

/*global window, document, google, map*/

/** Set up global types so JSHint doesn't trigger warnings that they are not defined */

/*global xr, GMaps, Promise, setTimeout, window, document, console, alert, ArrayBuffer, Uint8Array, Blob, saveAs, darkGrey, coolGrey, paleDawn, shiftWorker, simpleLight, muted, iovation, navigator, google */

//global map variable
var map;

var input, searchMarker, autoComplete, infoWindow;


//variable to hold running data
var currentNineFigureNumber;
var currentLatLng = {};
var currentRadius;
var loadedMarks = [];
var loadedOverlays = [];

//Variables for display
var mapSpinner;
var locateButton;
var zoomInMsg;
var errorMsg;
var displayingOverlays = false;
var redrawQueue = [];
var maxRequests = 30,
    perNumberOfSeconds = 60;
var lastQueueExecuteStartTime;
var mobileOS;
var elTimer;

//Variables for map data
var baseURL = 'https://maps.land.vic.gov.au/lvis/services/smesDataDelivery';
var scnAHDValues = ["ZEROTH ORDER", "2ND ORDER", "3RD ORDER", "SPIRIT LEVELLING"];
var scnGDA94Value = "ADJUSTMENT";
var pcmSearchText = "PCM";

var ZOOM_MSG_TEXT = '<span class="zoom-in-message-text">Zoom in to see marks</span>';

window.addEventListener('load', function (e) {

    lastQueueExecuteStartTime = Date.now();

    mapSpinner = document.querySelector("[id=map-spinner]");
    zoomInMsg = document.querySelector("[id=zoom-in-msg]");
    errorMsg = document.querySelector("[id=error-msg]");
    locateButton = document.querySelector("[id=locate]");
    locateButton.addEventListener("click", geoLocate, false);

    createMap();
    geoLocate();

    document.getElementById("hamburger-menu").addEventListener("click", showDrawer, false);


}, false);

function showDrawer() {
    var layout = document.querySelector('.mdl-layout');
    layout.MaterialLayout.drawerToggleHandler_();
}

/**
 * Create the map object and set its default attributes / operations.
 */
function createMap() {

    mobileOS = isMobile();

    map = new GMaps({
        div: '#map',
        lat: -37.813942,
        lng: 144.9711861,
        styles: iovation,
        zoom_changed: function (e) {
            checkSizeofCurrentMap();
        },
        idle: function (e) {
            //elTimer = new Date();
            //console.log('Start redraw process: ' + elTimer);
            queueRedraw();
        }

    });

    setUpAutoComplete();

}

/**
 * Get the browser's current location.
 */
function geoLocate() {

    GMaps.geolocate({
        success: function (position) {
            map.setCenter(position.coords.latitude, position.coords.longitude);
        }
    });

    checkSizeofCurrentMap();
    queueRedraw();

}

/**
 * Queue the redraw request and begin the process operation.
 */
function queueRedraw() {

    //console.log('Adding to queue elapsed ms: ' + (Date.now() - elTimer));
    redrawQueue.push(Date.now());
    processQueue();

}

/**
 * Process the redraw operation queue.
 */
function processQueue() {

    var inc = (perNumberOfSeconds / maxRequests) * 1000;
    var elapsed = Date.now() - lastQueueExecuteStartTime;

    if (redrawQueue.length > 0) {
        if (elapsed >= inc) {
            //console.log('Executing elapsed ms: ' + (Date.now() - elTimer));
            executeRedrawFromQueue();
        } else {
            //console.log('Waiting elapsed ms: ' + (Date.now() - elTimer));
            //console.log('Queue elapsed: ' + elapsed);
            //console.log('Queue inc: ' + inc);
            window.setTimeout(function () {
                processQueue();
                //Reschedule for difference between current date time and expected date time for next execution - add 50 ms to allow for execution time
            }, inc - elapsed + 50);
        }

    }

}

/**
 * Execute the redraw operation from the queue, and clear the queue.
 */
function executeRedrawFromQueue() {

    if (redrawQueue.length > 0) {
        //Set last execution time stamp
        lastQueueExecuteStartTime = Date.now();
        //truncate queue - to remove all pending requests
        redrawQueue.length = 0;
        //redraw map
        redrawMapInfo();
    }
}

/**
 * Redraw the map at the current location.  Call the retrieveMarkInformation and draw markers as appropriate.
 */
function redrawMapInfo() {
    var markInf;
    var coords = {};

    //console.log('Starting redraw elapsed ms: ' + (Date.now() - elTimer));

    mapSpinner.classList.remove("hidden");

    coords.lat = map.getCenter().lat();
    coords.lng = map.getCenter().lng();

    //Check for wrapped coords
    if (coords.lat < (-180)) {
        coords.lat = coords.lat + 360;
    }

    //Check for wrapped coords
    if (coords.lng < (-180)) {
        coords.lng = coords.lng + 360;
    }


    //console.log('Finished moving or zooming map:' + coords.lat + ', ' + coords.lng);

    if (currentRadius > 0 && currentRadius <= 2) {

        retrieveMarkInformation(coords.lat, coords.lng).then(function (markInf) {
                if (markInf.length > 0) {
                    //Draw markers if value returned
                    addMarkers(markInf);
                }
                mapSpinner.classList.add("hidden");
                //console.log('Finished redraw (successful) elapsed ms: ' + (Date.now() - elTimer));

            })
            .catch(function (err) {
                mapSpinner.classList.add("hidden");
                console.log(err);
            });

    } else {

        mapSpinner.classList.add("hidden");
        //console.log('Finished redraw (too big) elapsed ms: ' + (Date.now() - elTimer));
    }


}

/**
 * Determines what type of mark symbol should be used to display a specific mark.
 * @param {object} surveyMark - the data structure with the information for the specific mark
 * @return {string} - the symbol name to be used
 */
function returnMarkerIconType(surveyMark) {
    var isSCN, isPCM, hasAHD, isSCNGDA94, isSCNAHD;

    //Set default values for each type
    isSCN = false;
    isPCM = false;
    hasAHD = false;
    isSCNGDA94 = false;
    isSCNAHD = false;

    if (surveyMark.status != "OK") {
        //Defective mark
        return "mark-defective";
    } else {
        //OK mark - determine other values
        if (surveyMark.scn === "Yes") {
            isSCN = true;
        }
        //Check if it has an AHD Height
        if (surveyMark.ahdHeight !== "") {
            hasAHD = true;
        }
        //Check if PCM - Nine Figure Number starts with 1
        if (String(surveyMark.nineFigureNumber).indexOf("1") === 0) {
            isPCM = true;
        }
        //Retrieve GDA94 technique to determine whether SCN GDA94
        if (surveyMark.gda94Technique.indexOf(scnGDA94Value) >= 0) {
            isSCNGDA94 = true;
        }

        //Check AHD technique to determine whether it is SCN AHD
        scnAHDValues.forEach(function (ahdApproxValue) {
            if (surveyMark.ahdTechnique.indexOf(ahdApproxValue) >= 0) {
                isSCNAHD = true;
            }
        });

        //Now all of the source values have been retrieved, work through possible combinations to determine correct symbol
        if (!isSCN && !hasAHD) {
            return "mark-gda94approx-pm";
        } else if (!isSCN && hasAHD) {
            return "mark-ahdapprox-pm";
        } else if (isSCN && isPCM) {
            return "mark-scn-gda94-pcm";
        } else if (isSCN && !hasAHD && !isPCM) {
            return "mark-scn-gda94-pm";
        } else if (isSCN && hasAHD && !isSCNGDA94) {
            return "mark-scn-ahd-pm";
        } else if (isSCN && hasAHD && isSCNGDA94 && isSCNAHD) {
            return "mark-scn-gda94-ahd-pm";
        } else if (isSCN && hasAHD && isSCNGDA94 && !isSCNAHD) {
            return "mark-scn-gda94-ahdapprox-pm";
        }
    }



}

/**
 * Draw markers for the marks retrieved from getMarkInformation to the map.
 * @param {object} mapMarkerInf - the data structure with the mark information
 */
function addMarkers(mapMarkerInf) {

    var markerIcon, markerSize, zoomLevel;
    var addOverlay = false;

    zoomLevel = map.getZoom();

    if (zoomLevel < 16) {
        markerSize = 12;
    } else if (zoomLevel >= 16 && zoomLevel < 17) {
        markerSize = 14;
    } else if (zoomLevel >= 17 && zoomLevel < 19) {
        markerSize = 16;
    } else if (zoomLevel >= 19 && zoomLevel < 21) {
        markerSize = 20;
        addOverlay = true;
    } else {
        markerSize = 24;
        addOverlay = true;
    }

    //Was displaying overlays and now scale is too large for overlays so remove from screen
    if (displayingOverlays && !addOverlay) {
        //Clear overlays
        map.removeOverlays();
        loadedOverlays = [];
    }



    mapMarkerInf.forEach(function (surveyMark) {
        //Determine correct icon type
        var iconType = returnMarkerIconType(surveyMark);
        var navigateString;

        //Set icon file based on type and size
        markerIcon = "symbology/" + iconType + "-" + markerSize + ".png";

        //check if this mark has been loaded
        if (loadedMarks.indexOf(surveyMark.nineFigureNumber) === -1) {

            if (mobileOS !== "") {
                navigateString = '<button id="navigate' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--primary smes-button fade-in">&nbsp;&nbsp;Navigate to mark&nbsp;&nbsp;</button>';
            } else {
                navigateString = '';
            }

            map.addMarker({
                lat: surveyMark.latitude,
                lng: surveyMark.longitude,
                animation: google.maps.Animation.DROP,
                title: surveyMark.name,
                icon: markerIcon,
                infoWindow: {
                    content: '<p class="mdl-color-text--primary"><b>' + surveyMark.name + '</b></p><hr>' +
                        '<p>Nine Figure Number: ' + surveyMark.nineFigureNumber + '</p>' +
                        '<p>Status: ' + surveyMark.status + '</p>' +
                        '<p>SCN: ' + surveyMark.scn + '</p>' +
                        '<p>Zone: ' + surveyMark.zone + '</p>' +
                        '<p>Easting: ' + surveyMark.easting + '</p>' +
                        '<p>Northing: ' + surveyMark.northing + '</p>' +
                        '<p>AHD Height: ' + surveyMark.ahdHeight + '</p>' +
                        '<p>Ellipsoid Height: ' + surveyMark.ellipsoidHeight + '</p>' +
                        '<p>GDA94 Technique: ' + surveyMark.gda94Technique + '</p>' +
                        '<p>AHD Technique: ' + surveyMark.ahdTechnique + '</p>' +
                        '<hr>' +
                        navigateString +
                        '<button id="sketch' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--primary smes-button fade-in">&nbsp;&nbsp;View Mark Sketch&nbsp;&nbsp;</button>' +
                        '<button id="report' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color-text--primary smes-button fade-in">&nbsp;&nbsp;View Mark Report&nbsp;&nbsp;</button>',
                    domready: function (e) {
                        document.querySelector("[id=sketch" + surveyMark.nineFigureNumber + "]").addEventListener("click", getSurveyMarkSketch, false);
                        document.querySelector("[id=report" + surveyMark.nineFigureNumber + "]").addEventListener("click", getSurveyMarkReport, false);
                        if (mobileOS !== "") {
                            document.querySelector("[id=navigate" + surveyMark.nineFigureNumber + "]").addEventListener("click", startNavigation, false);
                        }
                    }
                },
                click: function (e) {
                    currentNineFigureNumber = surveyMark.nineFigureNumber;
                    currentLatLng.lat = surveyMark.latitude;
                    currentLatLng.lng = surveyMark.longitude;
                    //console.log("Opening: " + surveyMark.nineFigureNumber);
                },
            });

            //Add mark to loaded marks
            loadedMarks.push(surveyMark.nineFigureNumber);
        } else {
            //Mark has been loaded so check if it has the correct size symbol

            //Retrieve correct marker
            var loadedMarker = map.markers.filter(function (marker) {
                return marker.title === surveyMark.name;
            });

            //check the symbol, and refresh if necessary
            if (loadedMarker[0].icon !== markerIcon) {
                loadedMarker[0].setIcon(markerIcon);
            }
        }


        //Draw overlay if zoom is > 17
        if (addOverlay) {
            displayingOverlays = true;

            //check if this overlay has been loaded
            if (loadedOverlays.indexOf(surveyMark.nineFigureNumber) === -1) {

                map.drawOverlay({
                    lat: surveyMark.latitude,
                    lng: surveyMark.longitude,
                    verticalAlign: 'bottom',
                    horiztonalAlign: 'center',
                    content: '<div class="overlay"><span class="overlay-text">' + surveyMark.name + '</span></div>'
                });

                //Add mark to loaded overlays
                loadedOverlays.push(surveyMark.nineFigureNumber);

            }
        }

    });

}

/**
 * Attempt to detect the page being used ona  mobile device.
 * @return {string} - Android, iOS or empty string
 */
function isMobile() {

    var userAgent = navigator.userAgent;

    if (userAgent.match(/Android/i)) {
        return "Android";
    } else if (userAgent.match(/iPhone/i) || userAgent.match(/iPad/i)) {
        return "iOS";
    } else {
        return "";
    }

}
/**
 * Display the error message on the screen with the default text
 */
function displayError() {
    errorMsg.classList.remove("hidden");
    errorMsg.textContent = "Too many requests have been sent to the server.  Please wait...";
    window.setTimeout(function () {
        clearError();
    }, 1000);
}

/**
 * Hide the error message from the screen
 */
function clearError() {
    errorMsg.classList.add("hidden");
}

function setUpAutoComplete() {

    input = document.getElementById('pac-input');

    searchMarker = new google.maps.Marker({
        map: map.map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    autoComplete = new google.maps.places.Autocomplete(input);
    autoComplete.bindTo('bounds', map.map);

    infoWindow = new google.maps.InfoWindow();

    autoComplete.addListener('place_changed', function () {
        infoWindow.close();
        searchMarker.setVisible(false);
        var place = autoComplete.getPlace();

        if (!place.geometry) {
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.map.fitBounds(place.geometry.viewport);
        } else {
            map.map.setCenter(place.geometry.location);
            map.setZoom(17); // Why 17? Because it will likely be close enough to load marks.
        }
        //Check for marks at new location
        queueRedraw();
        //Add map icon
        searchMarker.setIcon( /** @type {google.maps.Icon} */ ({
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35)
        }));
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

        infoWindow.setContent('<div><strong>' + place.name + '</strong><br>' + address + '</div>');
        infoWindow.open(map.map, searchMarker);

    });

    searchMarker.addListener('click', function () {
        infoWindow.open(map.map, searchMarker);
    });

}

/**
 * Attempt to open Google amps and start navigation to the currently selected mark's coordinates
 */

function startNavigation() {
    clearError();

    if (typeof currentLatLng.lat === "number" && typeof currentLatLng.lng === "number" && mobileOS !== "") {
        var navURL;

        if (mobileOS === "Android") {
            navURL = "google.navigation:q=" + currentLatLng.lat + "," + currentLatLng.lng;
        } else {
            navURL = "http://maps.apple.com/?daddr=" + currentLatLng.lat + "," + currentLatLng.lng;
        }

        window.open(navURL);

    }


}

/**
 * Call the getSurveyMarkSketchResponse function and open a new tab with the PDF result.  Use the currently selected nine figure number
 */
function getSurveyMarkSketch() {
    clearError();

    getSurveyMarkSketchResponse(currentNineFigureNumber).then(function (markSketchData) {

            window.open("data:application/pdf;base64," + encodeURI(markSketchData.document), "_blank");
            //saveAs(dataURItoBlob("data:application/pdf;base64," + encodeURI(markSketchData.document)), "Survey Mark " + currentNineFigureNumber + " Sketch Report.pdf");

        })
        .catch(function (err) {
            console.log(err);
            displayError(err);
        });

}
/**
 * Call the getSurveyMarkReportResponse function and open a new tab with the PDF result.  Use the currently selected nine figure number
 */
function getSurveyMarkReport() {
    clearError();

    getSurveyMarkReportResponse(currentNineFigureNumber).then(function (markReportData) {

            window.open("data:application/pdf;base64," + encodeURI(markReportData.document), "_blank");
            //saveAs(dataURItoBlob("data:application/pdf;base64," + encodeURI(markReportData.document)), "Survey Mark " + currentNineFigureNumber + " Full Report.pdf");

        })
        .catch(function (err) {
            console.log(err);
            displayError(err);
        });


}

/**
 * Call the getMarkInfornmation web service.  This is being called using for a specific mark using its Nine Figure Number
 * @param {number} cLat, cLong - the coordinates for the center of the radius to search in
 * @return {promise} a promise which will resolve a data structure which contains the mark information 
 */
function retrieveMarkInformation(cLat, cLong) {
    clearError();

    //Show map spinner
    mapSpinner.classList.remove("hidden");

    return new Promise(function (resolve, reject) {
        xr.get(baseURL + '/getMarkInformation', {
                searchType: "Location",
                latitude: cLat,
                longitude: cLong,
                radius: currentRadius,
                format: "Brief"
            })
            .then(function (jsonResponse) {

                //Check for success - the messages element will not be present for success
                if (typeof jsonResponse.messages === 'undefined') {
                    //Results returned
                    //console.log(JSON.stringify(jsonResponse));
                    zoomInMsg.classList.add("hidden");
                    resolve(jsonResponse.data);
                } else {
                    //Error returned
                    //Check for too many marks
                    if (jsonResponse.messages.message === "More than 250 marks were found for this search. Please refine your search criteria.") {
                        //Add message that the area has too many marks
                        console.log("Too many marks");
                        mapSpinner.classList.add("hidden");
                        zoomInMsg.innerHTML = ZOOM_MSG_TEXT;
                        zoomInMsg.classList.remove("hidden");

                    } else if (jsonResponse.messages.message === "No survey marks matched the criteria provided.") {
                        //Check for no marks
                        console.log("No marks found");
                        zoomInMsg.innerHTML = ZOOM_MSG_TEXT;
                        mapSpinner.classList.remove("hidden");
                    } else {
                        //another message returned, log it
                        console.log(jsonResponse.messages.message);
                        displayError(jsonResponse.messages.message);
                        mapSpinner.classList.add("hidden");
                    }
                }

            })
            .catch(function (err) {
                console.log(err);
                displayError();
                return Promise.reject(err);
            });
    });

}

/**
 * Call the getSurveyMarSketches web service.  This is being called for a specific mark using its Nine Figure Number.
 * @param {string} nineFigureNumber - the mark's Ninem Figure Number
 * @return {promise} a promise which will resolve a data structure which contains the base64 encoded PDF 
 */

function getSurveyMarkSketchResponse(nineFigureNumber) {

    return new Promise(function (resolve, reject) {
        xr.get(baseURL + '/getSurveyMarkSketches', {
                markList: nineFigureNumber,
                returnDefective: true
            })
            .then(function (jsonResponse) {

                //Check for success - the messages element will not be present for success
                if (typeof jsonResponse.messages === 'undefined') {
                    //Results returned
                    resolve(jsonResponse.data);
                } else {
                    //Error returned
                    //another message returned, log it
                    console.log(jsonResponse.messages.message);
                }

            })
            .catch(function (err) {
                console.log(err);
                displayError();
                return Promise.reject(err);
            });
    });
}

/**
 * Call the getSurveyMarkReports web service.  This is being called for a specific mark using its Nine Figure Number
 * @param {string} nineFigureNumber - the mark's Nine Figure Number
 * @return {promise} a promise which will resolve a data structure which contains the base64 encoded PDF 
 */
function getSurveyMarkReportResponse(nineFigureNumber) {

    return new Promise(function (resolve, reject) {
        xr.get(baseURL + '/getSurveyMarkReports', {
                markList: nineFigureNumber,
                returnDefective: true
            })
            .then(function (jsonResponse) {

                //Check for success - the messages element will not be present for success
                if (typeof jsonResponse.messages === 'undefined') {
                    //Results returned
                    resolve(jsonResponse.data);
                } else {
                    //Error returned
                    //another message returned, log it
                    console.log(jsonResponse.messages.message);
                }

            })
            .catch(function (err) {
                console.log();
                return Promise.reject(err);
            });
    });
}

/**
 * Check to see whether the map is zoomed to 2km "radius" or less.  Radius is determined by measuring from the centre point to the wouth west corner of the map
 */
function checkSizeofCurrentMap() {

    mapSpinner.classList.remove("hidden");

    var mapBounds = map.getBounds();
    //console.log(mapBounds);
    //console.log(centreCoords);
    //console.log(Date.now() + ": zoom changed");

    if (typeof mapBounds !== 'undefined') {
        var mapRadius = getDistanceKms(map.getCenter().lat(), map.getCenter().lng(), map.getBounds().getSouthWest().lat(), map.getBounds().getSouthWest().lng());
        //console.log("Radius in kms:" + (mapRadius / 1000));

        currentRadius = (mapRadius / 1000);
    } else {
        currentRadius = 0;
    }

    if (currentRadius > 0 && currentRadius <= 2) {
        zoomInMsg.classList.add("hidden");
    } else {
        zoomInMsg.innerHTML = ZOOM_MSG_TEXT;
        zoomInMsg.classList.remove("hidden");
    }

    mapSpinner.classList.add("hidden");
}

/**
 * Calculate the distance between two points in kilometres
 * @params {number} - coordinate values in latitude and longitude for the two points
 */
function getDistanceKms(point1Lat, point1Lng, point2Lat, point2Lng) {
    var R = 6378137; // Earth’s mean radius
    var dLat = calcRad(point2Lat - point1Lat);
    var dLong = calcRad(point2Lng - point1Lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(calcRad(point1Lat)) * Math.cos(calcRad(point2Lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d; // returns the distance in metres
}

/**
 * Calculate radians for a given value
 * @params {number} x - the input value
 */
function calcRad(x) {
    return x * Math.PI / 180;
}

function dataURItoBlob(dataURI, callback) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = window.atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new Blob([ab]);
    return bb;
}
