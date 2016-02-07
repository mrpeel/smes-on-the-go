/*global xr, SMESGMap, SMESMarkStore, Promise, setTimeout, window, document, console, alert, ArrayBuffer, Uint8Array, Blob, saveAs, darkGrey, coolGrey, paleDawn, shiftWorker, simpleLight, muted, iovation, navigator, google, SMESMap, MarkStore */


//Variables for display
var mapSpinner;
var locateButton;
var zoomInMsg;
var errorMsg;
var mobileOS;
var elTimer;

var smesMap;
var markStore;
var scnAHDValues = ["ZEROTH ORDER", "2ND ORDER", "3RD ORDER", "SPIRIT LEVELLING"];
var scnGDA94Value = "ADJUSTMENT";
var pcmSearchText = "PCM";
var currentNineFigureNumber;
var currentLatLng = {};
var currentRadius;


window.addEventListener('load', function (e) {

    mapSpinner = document.querySelector("[id=map-spinner]");
    zoomInMsg = document.querySelector("[id=zoom-in-msg]");
    errorMsg = document.querySelector("[id=error-msg]");
    locateButton = document.querySelector("[id=locate]");
    locateButton.addEventListener("click", geoLocate, false);
    document.getElementById("hamburger-menu").addEventListener("click", showDrawer, false);
    document.getElementById("clear-search").addEventListener("click", clearSearch, false);

    setupMap();
    geoLocate();


}, false);


function showDrawer() {
    var layout = document.querySelector('.mdl-layout');
    layout.MaterialLayout.drawerToggleHandler_();
}

function clearSearch() {
    document.getElementById("location-search").value = "";
    document.getElementById("clear-search-div").classList.add("hidden");
}

function setupMap() {

    var mapOptions = {};
    mapOptions.idle = requestMarkInformation;
    mapOptions.zoomChanged = displayZoomMessage;

    smesMap = new SMESGMap("map", mapOptions);
    markStore = new SMESMarkStore();
    smesMap.setUpAutoComplete("location-search", "clear-search-div");

    mobileOS = isMobile();

    loadMarks();

    if (!markStore.useLocalStore) {
        zoomInMsg.innerHTML = '<span class="zoom-in-message-text">Zoom to display marks</span>';
    }

    displayZoomMessage();

}

/**
 * Get the browser's current location.
 */
function geoLocate() {

    smesMap.geoLocate();

}

function requestMarkInformation() {

    var mapCenter, radius;

    mapCenter = smesMap.map.getCenter();
    radius = smesMap.mapSize || 2;

    console.log("requestMarkInformation");

    markStore.requestMarkInformation(mapCenter.lat(), mapCenter.lng(), radius, loadMarks, displayZoomMessage);
    console.log(markStore.newIndex);

}


function displayZoomMessage() {

    if (!smesMap.mapSize || smesMap.mapSize > 2) {
        zoomInMsg.classList.remove("hidden");
    } else {
        zoomInMsg.classList.add("hidden");
    }
}

function loadMarks() {
    //Work through the new markers and add to the map, then work through updated markers and update on the map
    var surveyMark, address, iconName, navigateString, scnDiv, infoWindowContent, contentSDiv, contentMDiv, contentEDiv;

    console.log("loadMarks");

    //Add new marks
    for (var n = 0; n < markStore.newIndex.length; n++) {

        var eventListeners = {};
        var marker = {};
        var label = {};

        surveyMark = markStore.markData[markStore.newIndex[n]].data;
        address = markStore.markData[markStore.newIndex[n]].address || '';
        iconName = "symbology/" + returnMarkerIconType(surveyMark);

        if (mobileOS !== "") {
            navigateString = '<button id="navigate' + surveyMark.nineFigureNumber + '" class="smes-button mdl-button mdl-js-button mdl-js-ripple-effect fade-in">Navigate</button>';
        } else {
            navigateString = '';
        }

        if (surveyMark.scn === "Yes") {
            scnDiv = "SCN";
        } else {
            scnDiv = "Non-SCN";
        }

        eventListeners.domready = domReadyHandler(surveyMark.nineFigureNumber);
        eventListeners.click = markClickHandler(surveyMark.nineFigureNumber, parseFloat(surveyMark.latitude), parseFloat(surveyMark.longitude));

        contentSDiv = '<div class="card-content"><div class="card-left">';
        contentMDiv = '</div><div class="card-value">';
        contentEDiv = '</div></div>';

        infoWindowContent = '<div class="info-window-header">' +
            '<div class="section__circle-container mdl-cell mdl-cell--2-col mdl-cell--1-col-phone">' +
            '<div class="section__circle-container__circle card-symbol"> ' +
            '<img class="info-symbol" src="' + iconName + '.svg">' +
            '</div>' +
            '</div>' +
            '<div class="section__text mdl-cell mdl-cell--6-col-desktop mdl-cell--4-col-tablet mdl-cell--4-col-phone">' +
            '<div class="nine-figure">' + surveyMark.nineFigureNumber + '</div>' +
            '<div class="mark-name">' + surveyMark.name + '</div>' +
            '<div class="mark-status"><div>' + scnDiv + '</div>' +
            '</div></div>' +
            '<div id="address' + surveyMark.nineFigureNumber + '"></div></div>' +
            contentSDiv + 'AHD height:' + contentMDiv + surveyMark.ahdHeight + contentEDiv +
            contentSDiv + 'Ellipsoid height:' + contentMDiv + surveyMark.ellipsoidHeight + contentEDiv +
            contentSDiv + 'GDA94 technique:' + contentMDiv + surveyMark.gda94Technique + contentEDiv +
            contentSDiv + 'AHD technique:' + contentMDiv + surveyMark.ahdTechnique + contentEDiv +
            contentSDiv + 'MGA:' + contentMDiv + surveyMark.zone + ', ' + surveyMark.easting + ', ' + surveyMark.northing + contentEDiv +
            '<div class = "button-section">' +
            '<button id="sketch' + surveyMark.nineFigureNumber + '" class="smes-button mdl-button mdl-js-button mdl-js-ripple-effect fade-in">Sketch</button>' +
            '<button id="report' + surveyMark.nineFigureNumber + '" class="smes-button mdl-button mdl-js-button mdl-js-ripple-effect fade-in">Report</button>' +
            navigateString +
            '</div>';


        marker.lat = surveyMark.latitude;
        marker.lng = surveyMark.longitude;
        marker.title = surveyMark.name;
        marker.icon = iconName;
        marker.nineFigureNo = surveyMark.nineFigureNumber;
        marker.eventListeners = eventListeners;
        marker.infoWindowContent = infoWindowContent;



        smesMap.addMarker(marker);

        label.lat = surveyMark.latitude;
        label.lng = surveyMark.longitude;
        label.label = surveyMark.name;
        label.nineFigureNo = surveyMark.nineFigureNumber;

        smesMap.addLabel(label);

    }

    //Update marks
    for (var u = 0; u < markStore.updateIndex.length; u++) {

        var uMarker = {};
        var uLabel = {};

        surveyMark = markStore.markData[markStore.newIndex[u]].data;
        iconName = returnMarkerIconType(surveyMark);


        uMarker.lat = surveyMark.latitude;
        uMarker.lng = surveyMark.longitude;
        uMarker.title = surveyMark.name;
        uMarker.icon = iconName;
        uMarker.nineFigureNo = surveyMark.nineFigureNumber;
        uMarker.infoWindowContent = infoWindowContent;


        smesMap.updateMarker(uMarker);


        uLabel.lat = surveyMark.latitude;
        uLabel.lng = surveyMark.longitude;
        uLabel.label = surveyMark.name;
        uLabel.nineFigureNo = surveyMark.nineFigureNumber;

        smesMap.updateLabel(uLabel);

    }

    //Call the zoom level to show / hide marks and labels as required
    smesMap.setZoomLevel();
}

function markClickHandler(nineFigureNumber, lat, lng) {
    return function () {
        currentNineFigureNumber = nineFigureNumber;
        currentLatLng.lat = lat;
        currentLatLng.lng = lng;

        var addressDiv = document.getElementById("address" + nineFigureNumber);
        var address = "";

        if (addressDiv) {
            address = smesMap.returnAddress(currentNineFigureNumber);
            if (address !== "") {
                addressDiv.innerHTML = address;
            } else {
                smesMap.reverseGeocode(currentLatLng.lat, currentLatLng.lng).then(function (result) {
                    if (result !== "") {
                        //Find address div if it is still on the screen by the time the address returns;

                        addressDiv.innerHTML = result;

                        markStore.updateAddress(currentNineFigureNumber, result);

                    }
                });

            }
        }


        console.log(nineFigureNumber);
    };

}

function domReadyHandler(nineFigureNumber) {
    return function () {
        document.querySelector("[id=sketch" + nineFigureNumber + "]").addEventListener("click", function () {
            console.log('Sketch: ' + nineFigureNumber);

            markStore.getSurveyMarkSketchResponse(nineFigureNumber).then(function (pdfData) {
                var blob = markStore.base64toBlob(pdfData.document, 'application/pdf');

                saveAs(blob, nineFigureNumber + '-sketch.pdf');
            }).catch(function (error) {
                console.log("PDF retrieval failed");
            });

        }, false);
        document.querySelector("[id=report" + nineFigureNumber + "]").addEventListener("click", function () {
            console.log('Report: ' + nineFigureNumber);

            markStore.getSurveyMarkReportResponse(nineFigureNumber).then(function (pdfData) {
                var blob = markStore.base64toBlob(pdfData.document, 'application/pdf');

                saveAs(blob, nineFigureNumber + '-report.pdf');
            }).catch(function (error) {
                console.log("PDF retrieval failed");
            });

        }, false);
        if (mobileOS !== "") {
            document.querySelector("[id=navigate" + nineFigureNumber + "]").addEventListener("click", startNavigation, false);
        }

    };

}

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
        return "defective";
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
            return "gda94approx-pm";
        } else if (!isSCN && hasAHD) {
            return "ahdapprox-pm";
        } else if (isSCN && isPCM) {
            return "scn-gda94-pcm";
        } else if (isSCN && !hasAHD && !isPCM) {
            return "scn-gda94-pm";
        } else if (isSCN && hasAHD && !isSCNGDA94) {
            return "scn-ahd-pm";
        } else if (isSCN && hasAHD && isSCNGDA94 && isSCNAHD) {
            return "scn-gda94-ahd-pm";
        } else if (isSCN && hasAHD && isSCNGDA94 && !isSCNAHD) {
            return "scn-gda94-ahdapprox-pm";
        }
    }



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
