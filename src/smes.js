/*global xr, SMESGMap, SMESMarkStore, Promise, setTimeout, window, document, console, alert, ArrayBuffer, Uint8Array, Blob, saveAs, darkGrey, coolGrey, paleDawn, shiftWorker, simpleLight, muted, iovation, navigator, google, SMESMap, MarkStore, componentHandler */


//Variables for display
var loader;
var connectionIndicator, connectIcon, connectToolTip;
var locateButton;
var zoomInMsg;
var errorMsg;
var mobileOS;
var elTimer;
var overlayEl;

var smesMap;
var markStore;
var scnAHDValues = ["ZEROTH ORDER", "2ND ORDER", "3RD ORDER", "SPIRIT LEVELLING"];
var scnGDA94Value = "ADJUSTMENT";
var pcmSearchText = "PCM";
var currentNineFigureNumber;
var currentLatLng = {};
var currentRadius;


window.addEventListener('load', function (e) {

    loader = document.getElementById("loader");
    connectionIndicator = document.getElementById("connection-indicator");
    connectIcon = document.getElementById("connect-icon");
    connectToolTip = document.getElementById("connection-tooltip");
    zoomInMsg = document.getElementById("zoom-in-msg");
    locateButton = document.getElementById("locate");
    locateButton.addEventListener("click", geoLocate, false);
    document.getElementById("hamburger-menu").addEventListener("click", showDrawer, false);
    document.getElementById("clear-search").addEventListener("click", clearSearch, false);
    document.getElementById("nav-about").addEventListener("click", showAbout, false);
    document.getElementById("about-OK").addEventListener("click", hideAbout, false);

    overlayEl = document.getElementById("screen-overlay");


    setupMap();

    var styleList = document.getElementById("style-option-list");

    //Set-up map style click handlers
    for (var i = 0; i < styleList.childNodes.length; i++) {
        if (styleList.childNodes[i].nodeType === 1) {
            createMapClickHandler(styleList.childNodes[i].id, styleList.childNodes[i].textContent);
        }

        //Reset map-style text if required
        if (smesMap.mapStyleName && smesMap.mapStyleName === styleList.childNodes[i].id) {
            document.getElementById("map-style-name").textContent = styleList.childNodes[i].textContent;

        }
    }

    geoLocate();


}, false);


function createMapClickHandler(elementName, elementText) {
    var el = document.getElementById(elementName);
    el.addEventListener("click", function () {
        smesMap.changeMapStyle(elementName);
        document.getElementById("map-style-name").textContent = elementText;
    });
}

function showDrawer() {
    var layout = document.querySelector('.mdl-layout');
    if (layout) {
        layout.MaterialLayout.drawerToggleHandler_();
    }

}

function showAbout() {

    if (overlayEl) {
        overlayEl.classList.remove("hidden");
    }
}

function hideAbout() {

    if (overlayEl) {
        overlayEl.classList.add("hidden");
    }
}

function clearSearch() {
    document.getElementById("location-search").value = "";
    document.getElementById("clear-search-div").classList.add("hidden");
}

function setupMap() {

    var mapOptions = {};
    mobileOS = isMobile();


    mapOptions.idle = requestMarkInformation;
    mapOptions.zoomChanged = displayZoomMessage;
    mapOptions.closeInfobox = function () {
        connectionIndicator.classList.remove("hidden");
    };

    smesMap = new SMESGMap("map", mapOptions);
    if (mobileOS !== "") {
        smesMap.map.setOptions({
            zoomControl: false
        });
    }


    markStore = new SMESMarkStore();
    smesMap.setUpAutoComplete("location-search", "clear-search-div");


    loadMarks();


    displayZoomMessage();

}

/**
 * Get the browser's current location.
 */
function geoLocate() {

    showLoader();
    smesMap.geoLocate();

}

function requestMarkInformation() {

    var mapCenter, radius;

    mapCenter = smesMap.map.getCenter();
    radius = smesMap.mapSize || 2;

    showLoader();

    console.log("requestMarkInformation");

    markStore.requestMarkInformation(mapCenter.lat(), mapCenter.lng(), radius, loadMarks, displayZoomMessage);
    //console.log(markStore.newIndex);

}

function showLoader() {
    loader.classList.remove("hidden");

    connectIcon.textContent = 'cloud_queue';
    connectionIndicator.classList.remove("connection-off");
    connectionIndicator.classList.remove("connected");
    connectionIndicator.classList.add("pulsating");
    connectToolTip.textContent = "Connecting to Land Victoria";



}

function hideLoader() {
    window.setTimeout(function () {
        loader.classList.add("hidden");
    }, 0);

}


function displayZoomMessage() {

    hideLoader();

    var currentZoom = smesMap.getZoom();
    var zoomContent;

    if (markStore.useLocalStore && currentZoom >= 14) {
        //zoomInMsg.innerHTML = '<span class="zoom-in-message-text">Displaying cached marks - zoom to refresh</span>';
        zoomContent = "Can't load marks at this zoom<br>Displaying cached marks only<br>Zoom in to load marks";
    } else {
        //zoomInMsg.innerHTML = '<span class="zoom-in-message-text">Zoom to display marks</span>';
        zoomContent = "Can't load marks at this zoom<br>Zoom in to load marks";
    }

    //Check that the infobox is currently being displayed beause ti overlays the map and obscures the box on mobile
    //  If map size doesn't exist, the map is too small or there are too many marks to load then show the message
    if (!smesMap.infoBox.getVisible() && (!smesMap.mapSize || smesMap.mapSize > 2 || currentZoom < 14 || markStore.tooManyMarks)) {
        connectIcon.textContent = 'cloud_off';
        connectionIndicator.classList.remove("pulsating");
        connectionIndicator.classList.remove("connected");
        connectionIndicator.classList.add("connection-off");
        connectToolTip.innerHTML = zoomContent;

    } else {
        connectIcon.textContent = 'cloud_done';
        connectionIndicator.classList.remove("connection-off");
        connectionIndicator.classList.remove("pulsating");
        connectionIndicator.classList.add("connected");
        connectToolTip.innerHTML = "Marks loaded";
    }

}

function loadMarks() {
    //Work through the new markers and add to the map, then work through updated markers and update on the map
    var preparedMark;

    console.log("loadMarks");




    //Add new marks
    for (var n = 0; n < markStore.newIndex.length; n++) {


        preparedMark = prepMarkForMap(markStore.markData[markStore.newIndex[n]].data, markStore.markData[markStore.newIndex[n]].address || '');

        smesMap.addMarker(preparedMark.marker);
        smesMap.addLabel(preparedMark.label);

    }

    //Update marks
    for (var u = 0; u < markStore.updateIndex.length; u++) {


        preparedMark = prepMarkForMap(markStore.markData[markStore.updateIndex[u]].data, markStore.markData[markStore.updateIndex[u]].address || '');



        smesMap.updateMarker(preparedMark.marker);
        smesMap.updateLabel(preparedMark.label);

    }

    //Call the zoom level to show / hide marks and labels as required
    smesMap.setZoomLevel();
    displayZoomMessage();
}

/**Returns an object with the mark object and the mark label object
 **/
function prepMarkForMap(surveyMark, address) {
    var eventListeners = {};
    var marker = {};
    var label = {};
    var navigateString;

    var closeButton = '<button id="close-info-box" class="close-button mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
        '<i class="material-icons">close</i>' +
        '</button>';

    var cardDiv = '<div class="mdl-card infobox mdl-shadow--3dp overflow-x-visible">';
    var contentSDiv = '<div class="card-content"><div class="card-left">';
    var contentMDiv = '</div><div class="card-value">';
    var contentEDiv = '</div></div>';


    var markType = returnMarkType(surveyMark);

    if (mobileOS !== "") {
        navigateString = '<button id="navigate' + surveyMark.nineFigureNumber + '" class="smes-button mdl-button mdl-js-button mdl-js-ripple-effect fade-in">Navigate</button>';
    } else {
        navigateString = '';
    }


    eventListeners.domready = domReadyHandler(surveyMark.nineFigureNumber, surveyMark.name);
    eventListeners.click = markClickHandler(surveyMark.nineFigureNumber, parseFloat(surveyMark.latitude), parseFloat(surveyMark.longitude));


    var infoWindowContent = cardDiv + '<div class="mdl-card__title mdl-color-text--white">' +
        '<div class="info-window-header">' +
        '<div class="section__circle-container">' +
        '<div class="section__circle-container__circle card-symbol"> ' +
        '<img class="info-symbol" src="symbology/' + markType.iconName + '.svg">' +
        '</div>' +
        '</div>' +
        '<div class="header-text">' +
        '<div class="nine-figure">' + surveyMark.nineFigureNumber + '</div>' +
        '<div><h3 class="mdl-card__title-text">' + surveyMark.name + '</h3></div>' +
        '<div class="mark-status">' + markType.markDetails + '</div>' +
        '</div>' +
        '</div>' +
        closeButton +
        '</div>' +
        '<div class="mdl-card__supporting-text">' +


        '<div class="content-section">' +
        '<div class="content-icon"><i class="material-icons">swap_horiz</i></div>' +
        '<div class="content">' +
        //'<div id="address' + surveyMark.nineFigureNumber + '" class="mark-address"></div>' +
        contentSDiv + 'Address:' + contentMDiv + '<div id="address' + surveyMark.nineFigureNumber + '"></div>' + contentEDiv +
        contentSDiv + 'LL94:' + contentMDiv + surveyMark.latitude + ', ' + surveyMark.longitude + contentEDiv +
        contentSDiv + 'MGA:' + contentMDiv + surveyMark.zone + ', ' + surveyMark.easting + ', ' + surveyMark.northing + contentEDiv +
        contentSDiv + 'Technique:' + contentMDiv + surveyMark.gda94Technique + contentEDiv +
        contentSDiv + 'Ellipsoid height:' + contentMDiv + surveyMark.ellipsoidHeight + contentEDiv +
        contentSDiv + 'Uncertainty:' + contentMDiv + surveyMark.hUncertainty + contentEDiv +
        contentSDiv + 'Order:' + contentMDiv + surveyMark.hOrder + contentEDiv +
        contentSDiv + 'Measurements:' + contentMDiv + surveyMark.gda94Measurements + contentEDiv +
        '</div>' +
        '</div>' +
        '<div class="vert-spacer"></div>' +

        '<div class="content-section">' +
        '<div class="content-icon"><i class="material-icons">swap_vert</i></div>' +
        '<div class="content">' +
        contentSDiv + 'AHD height:' + contentMDiv + surveyMark.ahdHeight + contentEDiv +
        contentSDiv + 'Technique:' + contentMDiv + surveyMark.ahdTechnique + contentEDiv +
        contentSDiv + 'Uncertainty:' + contentMDiv + surveyMark.vUncertainty + contentEDiv +
        contentSDiv + 'Order:' + contentMDiv + surveyMark.vOrder + contentEDiv +
        contentSDiv + 'Level section:' + contentMDiv + surveyMark.ahdLevelSection + contentEDiv +
        '</div>' +
        '</div>' +

        '</div>' +
        '<div id="info-box-loader" class="hidden mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>' +
        '<div class="mdl-card__actions mdl-card--border">' +
        '<div class="horiz-spacer"></div>' +
        '<button id="sketch' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Sketch</button>' +
        '<button id="report' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Report</button>' +
        navigateString +
        '</div></div>';

    marker.lat = surveyMark.latitude;
    marker.lng = surveyMark.longitude;
    marker.title = surveyMark.name;
    marker.icon = 'symbology/' + markType.iconName;
    marker.nineFigureNo = surveyMark.nineFigureNumber;
    marker.eventListeners = eventListeners;
    marker.infoWindowContent = infoWindowContent;


    label.lat = surveyMark.latitude;
    label.lng = surveyMark.longitude;
    label.label = surveyMark.name;
    label.nineFigureNo = surveyMark.nineFigureNumber;

    return ({
        marker: marker,
        label: label
    });
}

function markClickHandler(nineFigureNumber, lat, lng) {
    return function () {
        currentNineFigureNumber = nineFigureNumber;
        currentLatLng.lat = lat;
        currentLatLng.lng = lng;

        //Hide connection icon
        connectionIndicator.classList.add("hidden");

        console.log(nineFigureNumber);
    };

}

function showBoxLoader() {
    var lEl = document.getElementById("info-box-loader");

    if (lEl) {
        lEl.classList.remove("hidden");
    }
}

function hideBoxLoader() {
    var lEl = document.getElementById("info-box-loader");

    if (lEl) {
        lEl.classList.add("hidden");
    }
}

function domReadyHandler(nineFigureNumber, markName) {

    var downloadName = markName.replace(/  +/g, ' ');

    return function () {
        //Make sure any created mdl component is registered qith the mdl component handler
        componentHandler.upgradeAllRegistered();

        //Locate address

        var addressDiv = document.getElementById("address" + nineFigureNumber);
        var address = "";

        if (addressDiv) {
            address = markStore.returnAddress(currentNineFigureNumber);
            if (address !== "") {
                addressDiv.innerHTML = address;
            } else {
                smesMap.reverseGeocode(currentLatLng.lat, currentLatLng.lng).then(function (result) {
                    if (result !== "") {
                        //Find address div if it is still on the screen by the time the address returns;

                        addressDiv.innerHTML = result;

                        markStore.setAddress(currentNineFigureNumber, result);

                    }
                });

            }
        }


        //Set-up button click for sketch
        document.querySelector("[id=sketch" + nineFigureNumber + "]").addEventListener("click", function () {
            console.log('Sketch: ' + nineFigureNumber);

            showBoxLoader();

            markStore.getSurveyMarkSketchResponse(nineFigureNumber).then(function (pdfData) {
                var blob = markStore.base64toBlob(pdfData.document, 'application/pdf');

                saveAs(blob, downloadName + '(' + nineFigureNumber + ') Sketch.pdf');
                hideBoxLoader();
            }).catch(function (error) {
                console.log("PDF retrieval failed");
                hideBoxLoader();
            });

        }, false);

        //Set-up button click for report
        document.querySelector("[id=report" + nineFigureNumber + "]").addEventListener("click", function () {
            console.log('Report: ' + nineFigureNumber);

            showBoxLoader();

            markStore.getSurveyMarkReportResponse(nineFigureNumber).then(function (pdfData) {
                var blob = markStore.base64toBlob(pdfData.document, 'application/pdf');

                saveAs(blob, downloadName + '(' + nineFigureNumber + ') Report.pdf');
                hideBoxLoader();
            }).catch(function (error) {
                console.log("PDF retrieval failed");
                hideBoxLoader();
            });

        }, false);
        //If onmobile, set-up button click for navigate
        if (mobileOS !== "") {
            document.querySelector("[id=navigate" + nineFigureNumber + "]").addEventListener("click", startNavigation, false);
        }

    };

}

function returnMarkType(surveyMark) {
    var markType = {};
    var isSCN = false,
        isPCM = false,
        hasAHD = false,
        isSCNGDA94 = false,
        isSCNAHD = false,
        isDefective = hasAHD;


    if (surveyMark.status != "OK") {
        //Defective mark
        isDefective = true;
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
        if (isDefective) {
            markType.iconName = "defective";
            markType.markDetails = "Defective";

        } else if (!isDefective && !isSCN && !hasAHD) {
            markType.iconName = "gda94approx-pm";
            markType.markDetails = "Non-SCN (GDA94)";
        } else if (!isDefective && !isSCN && hasAHD) {
            markType.iconName = "ahdapprox-pm";
            markType.markDetails = "Non-SCN (GDA94), non-SCN (AHD)";
        } else if (!isDefective && isSCN && isPCM) {
            markType.iconName = "scn-gda94-pcm";
            markType.markDetails = "SCN (GDA94)";
        } else if (!isDefective && isSCN && !hasAHD && !isPCM) {
            markType.iconName = "scn-gda94-pm";
            markType.markDetails = "SCN (GDA94)";
        } else if (!isDefective && isSCN && hasAHD && !isSCNGDA94) {
            markType.iconName = "scn-ahd-pm";
            markType.markDetails = "Non-SCN (GDA94), SCN (AHD)";
        } else if (!isDefective && isSCN && hasAHD && isSCNGDA94 && isSCNAHD) {
            markType.iconName = "scn-gda94-ahd-pm";
            markType.markDetails = "SCN (GDA94), SCN (AHD)";
        } else if (!isDefective && isSCN && hasAHD && isSCNGDA94 && !isSCNAHD) {
            markType.iconName = "scn-gda94-ahdapprox-pm";
            markType.markDetails = "Non-SCN (GDA94)";
        }
    }

    return markType;

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
