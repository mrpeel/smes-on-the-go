/*global Promise, setTimeout, window, document, console, navigator, self, MouseEvent, Blob, FileReader, module, atob, Uint8Array, define */
/*global ReverseGeocoder, fetch */


var SMESMarkStore = function () {
    "use strict";

    this.useLocalStore = this.localStorageAvailable();
    this.maxRequests = 15;
    this.perNumberOfSeconds = 60;
    this.lastStorageTimeStamp = Date.now();
    this.baseURL = 'https://maps.land.vic.gov.au/lvis/services/smesDataDelivery';
    this.updateIndex = [];
    this.newIndex = [];
    this.tooManyMarks = false;

    if (this.useLocalStore) {
        this.retrieveStoredMarks();
    } else {
        this.markData = {};
    }


};


SMESMarkStore.prototype.localStorageAvailable = function () {
    "use strict";

    try {
        var storage = window.localStorage,
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

SMESMarkStore.prototype.retrieveStoredMarks = function () {
    "use strict";

    var storedData, mark;

    if (!this.useLocalStore) {
        return;
    }

    storedData = window.localStorage.getItem('smes-mark-data');

    if (storedData) {
        this.markData = JSON.parse(storedData);
        //Remove data older than 14 days
        this.markData = this.removeOldMarks(14);
        //Add all marks to the new mark index - to ensure they will get loaded to the UI
        for (mark in this.markData) {
            this.newIndex.push(mark);
        }

    } else {
        this.markData = {};
    }




};

SMESMarkStore.prototype.clearStoredMarks = function () {
    "use strict";


    if (!this.useLocalStore) {
        return;
    }

    window.localStorage.removeItem('smes-mark-data');

};

SMESMarkStore.prototype.saveMarksToStorage = function () {
    "use strict";

    if (!this.useLocalStore) {
        return;
    }

    var self = this;
    var storageTimeStamp, culledMarkData;

    //Set timestamp for last storage
    self.lastStorageTimeStamp = Date.now();
    storageTimeStamp = self.lastStorageTimeStamp;

    //Set function to write storage after 20 seconds.
    // if another write request comes in within 20 seconds, this.lastStorageTimeStamp variable will have changed and the write will be aborted.
    window.setTimeout(function () {
        if (storageTimeStamp === self.lastStorageTimeStamp) {
            try {
                window.localStorage.setItem('smes-mark-data', JSON.stringify(self.markData));
                console.log("Data written to local storage");
            } catch (e) {
                try {
                    //Check total size - if >= 5MB then start culling - attempt to only store marks retrieved within the last 7 days
                    if (JSON.stringify(culledMarkData).length > 5000000) {
                        culledMarkData = self.removeOldMarks(7);
                    }

                    //Check total size - if still >= 5MB then start culling - attempt to only store marks retrieved in the last day
                    if (JSON.stringify(culledMarkData).length > 5000000) {
                        culledMarkData = self.removeOldMarks(7);
                    }

                    window.localStorage.setItem('smes-mark-data', JSON.stringify(culledMarkData));
                } catch (e) {
                    //Give up
                    console.log("Write to local storage failed");
                }
            }
        }
    }, 20000);

};

SMESMarkStore.prototype.removeOldMarks = function (numberOfDays) {
    "use strict";

    var individualMark;
    var comparisonDate;
    var newMarkData = this.markData;

    for (individualMark in newMarkData) {
        if (this.isNumberOfDaysOld(newMarkData[individualMark].lastUpdated, numberOfDays)) {
            delete newMarkData[individualMark];
        }
    }

    return newMarkData;
};

SMESMarkStore.prototype.isNumberOfDaysOld = function (dateValue, number) {
    "use strict";

    var comparisonDate = new Date(dateValue);
    var todaysDate = new Date();
    var msecPerDay = 1000 * 60 * 60 * 24;

    // Get the difference in milliseconds.
    var interval = todaysDate.getTime() - comparisonDate.getTime();

    // Calculate how many days the interval contains. Subtract that
    // many days from the interval to determine the remainder.
    var days = Math.floor(interval / msecPerDay);

    if (days >= number) {
        return true;
    } else {
        return false;
    }


};

SMESMarkStore.prototype.delayNextRequest = function () {
    "use strict";

    var self = this;

    //Set the last succesfull request in the future to prevent requests happening (clean-up if a 429 error has been triggered and need to back off)
    self.lastSuccesfullRetrieve = Date.now() + 20000;

};

SMESMarkStore.prototype.requestMarkInformation = function (cLat, cLong, cRadius, callback, tooManyCallback) {
    "use strict";

    var self = this;
    var currentRequestTimeStamp = new Date();
    //Set minimum time daly before executing web service request - this functions as a de-bounce operation
    var executionDelay = 500;

    //If an unacceptable radius has been supplied, don't call the service
    if (cRadius > 2) {
        return;
    }

    //Record the last request queued time
    self.lastQueuedTimeStamp = currentRequestTimeStamp;
    var minInterval = (self.perNumberOfSeconds / self.maxRequests) * 1000;


    //If there has already been a request to the server, make sure this request doesn't execute until the minimum interval time
    if (self.lastSuccesfullRetrieve) {
        //Calulate the interval since tghe last request went through
        var currentInterval = currentRequestTimeStamp - self.lastSuccesfullRetrieve;

        //Reset execution delay to the remaining interval plus the standard execution delay
        if (currentInterval < minInterval) {
            executionDelay = minInterval - currentInterval + executionDelay;
        }
    }

    //Execute the logic after the appropriate wait
    window.setTimeout(function () {
        //Check if this is still the most recently queued request
        if (currentRequestTimeStamp === self.lastQueuedTimeStamp) {
            console.log("Processing request");
            self.lastSuccesfullRetrieve = new Date();
            self.retrieveMarkInformation(cLat, cLong, cRadius).then(function (marksRetrieved) {
                //Check data element is present, if so process it, and run the callback function
                if (marksRetrieved) {
                    self.processRetrievedMarks(marksRetrieved).then(function () {
                        console.log("Executing callback");
                        self.tooManyMarks = false;
                        callback.apply(this);
                    });

                }
            }).catch(function (err) {
                if (err === "Too many marks") {
                    self.tooManyMarks = true;
                    tooManyCallback.apply(this);
                }
                console.log(err);
            });

        } else {
            console.log("Dropping request - newer request has arrived");
        }
    }, executionDelay);


};

SMESMarkStore.prototype.processRetrievedMarks = function (retrievedData) {
    "use strict";

    var self = this;
    var dataObject, dataHash, objectProp;

    return new Promise(function (resolve, reject) {


        //reset indexes of new and updates marks
        self.updateIndex = [];
        self.newIndex = [];

        //console.log("Mark count: " + self.countMarks());

        for (var i = 0; i < retrievedData.length; i++) {
            dataObject = retrievedData[i];

            //Check whether this mark is already in the store
            if (!self.markData[dataObject.nineFigureNumber]) {
                //Don't have mark, so add it
                dataHash = self.calculateDataHash(dataObject);
                self.addUpdateValueInStore(dataObject, dataHash);
                self.newIndex.push(dataObject.nineFigureNumber);

            } else {
                //Already have this mark - Check whether the mark was last retrieved within a day
                if (self.isNumberOfDaysOld(self.markData[dataObject.nineFigureNumber].lastUpdated || 0, 1)) {
                    //Check whether mark information has changed - using a simple data hash
                    dataHash = self.calculateDataHash(dataObject);

                    if (dataHash !== self.markData[dataObject.nineFigureNumber].dataHash) {
                        //data has changed so store data, store hash, remove address, and update lastUpdated
                        self.addUpdateValueInStore(dataObject, dataHash);
                        self.updateIndex.push(dataObject.nineFigureNumber);
                    } else {
                        //Latest data is the same so change the lastUpdated value to now
                        self.markData[dataObject.nineFigureNumber].lastUpdated = Date.now();
                    }
                }

            }

        }

        resolve(true);

        //console.log("Mark count: " + self.countMarks());

        //Trigger process to save marks into browser storage
        self.saveMarksToStorage();

    });


};


SMESMarkStore.prototype.countMarks = function () {
    "use strict";

    var self = this;
    var objectProp;
    var markCounter = 0;


    //Simple concatenation of the properties of the object - up to 24 vals
    for (objectProp in self.markData) {
        markCounter += 1;
    }

    return markCounter;
};

SMESMarkStore.prototype.calculateDataHash = function (dataObject) {
    "use strict";

    var objectProp, dataHash;

    dataHash = "";

    //Simple concatenation of the properties of the object - up to 24 vals
    for (objectProp in dataObject) {
        dataHash = dataHash + dataObject[objectProp];
    }

    return dataHash;
};

SMESMarkStore.prototype.addUpdateValueInStore = function (dataObject, dataHash) {
    "use strict";

    if (!this.markData[dataObject.nineFigureNumber]) {
        this.markData[dataObject.nineFigureNumber] = {};
    }

    this.markData[dataObject.nineFigureNumber].data = dataObject;
    this.markData[dataObject.nineFigureNumber].dataHash = dataHash;
    delete this.markData[dataObject.nineFigureNumber].address;
    this.markData[dataObject.nineFigureNumber].lastUpdated = Date.now();

};

SMESMarkStore.prototype.setAddress = function (nineFigureNumber, address) {
    "use strict";

    this.markData[nineFigureNumber].address = address;

};

SMESMarkStore.prototype.returnAddress = function (nineFigureNumber) {
    "use strict";

    var surveyMark = this.markData[nineFigureNumber] || null;
    return surveyMark.address || "";

};


/**
 * Call the getMarkInfornmation web service.  
 * @param {number} cLat, cLong - the coordinates for the center of the radius to search in
 * @return {promise} a promise which will resolve a data structure which contains the mark information 
 */
SMESMarkStore.prototype.retrieveMarkInformation = function (cLat, cLong, cRadius) {
    "use strict";

    var self = this;

    return new Promise(function (resolve, reject) {

        /*xr.get(self.baseURL + '/getMarkInformation', {
                searchType: "Location",
                latitude: cLat,
                longitude: cLong,
                radius: cRadius,
                format: "Full"
            })*/
        fetch(self.baseURL + "/getMarkInformation?searchType=Location&latitude=" + cLat + "&longitude=" + cLong + "&radius=" + cRadius + "&format=Full", {
                mode: 'cors'
            }).then(function (response) {
                return response.json();
            }).then(function (jsonResponse) {

                //Check for success - the messages element will not be present for success
                if (typeof jsonResponse.messages === 'undefined') {
                    //Results returned
                    resolve(jsonResponse.data);
                } else {
                    //Error returned
                    //Check for too many marks
                    if (jsonResponse.messages.message === "More than 250 marks were found for this search. Please refine your search criteria.") {
                        //Add message that the area has too many marks
                        console.log("Too many marks");
                        reject("Too many marks");

                    } else if (jsonResponse.messages.message === "No survey marks matched the criteria provided.") {
                        //Check for no marks
                        console.log("No marks found");
                        reject("No marks found");
                    } else {
                        //another message returned, log it
                        console.log(jsonResponse.messages.message);
                        reject("Webservice error");
                    }
                }

            })
            .catch(function (err) {
                console.log(err);
                //if (xr.status === 0 && xr.response === "") {
                self.delayNextRequest();
                console.log("Too many requests");
                //}
                return Promise.reject(err);
            });
    });

};

/**
 * Call the getSurveyMarSketches web service.  This is being called for a specific mark using its Nine Figure Number.
 * @param {string} nineFigureNumber - the mark's Ninem Figure Number
 * @return {promise} a promise which will resolve a data structure which contains the base64 encoded PDF 
 */

SMESMarkStore.prototype.getSurveyMarkSketchResponse = function (nineFigureNumber) {
    "use strict";

    var self = this;

    return new Promise(function (resolve, reject) {
        fetch(self.baseURL + "/getSurveyMarkSketches?returnDefective=true&markList=" + nineFigureNumber, {
                mode: 'cors'
            }).then(function (response) {
                return response.json();
            })
            /*xr.get(self.baseURL + '/getSurveyMarkSketches', {
                    markList: nineFigureNumber,
                    returnDefective: true
                })*/
            .then(function (jsonResponse) {

                //Check for success - the messages element will not be present for success
                if (typeof jsonResponse.messages === 'undefined') {
                    //Results returned
                    resolve(jsonResponse.data);
                } else {
                    //Error returned
                    //another message returned, log it
                    console.log(jsonResponse.messages.message);
                    reject("Webservice error");
                }

            })
            .catch(function (err) {
                console.log(err);
                return Promise.reject(err);
            });
    });
};

/**
 * Call the getSurveyMarkReports web service.  This is being called for a specific mark using its Nine Figure Number
 * @param {string} nineFigureNumber - the mark's Nine Figure Number
 * @return {promise} a promise which will resolve a data structure which contains the base64 encoded PDF 
 */
SMESMarkStore.prototype.getSurveyMarkReportResponse = function (nineFigureNumber) {
    "use strict";

    var self = this;

    return new Promise(function (resolve, reject) {
        /*xr.get(self.baseURL + '/getSurveyMarkReports', {
                markList: nineFigureNumber,
                returnDefective: true
            })*/
        fetch(self.baseURL + "/getSurveyMarkReports?returnDefective=true&markList=" + nineFigureNumber, {
            mode: 'cors'
        }).then(function (response) {
            return response.json();
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
                    reject("Webservice error");
                }

            })
            .catch(function (err) {
                console.log();
                return Promise.reject(err);
            });
    });
};

SMESMarkStore.prototype.base64toBlob = function (b64Data, contentType, sliceSize) {
    "use strict";

    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, {
        type: contentType
    });
    return blob;
};

/** SMESGMap class encapsulating the maps functionality required to load a map with custom controls,
    set-up markers and and infor windows
*/

/*global Promise, google, document, navigator, console, MapLabel, InfoBox, window*/

/** 
 */
var SMESGMap = function (elementId, options) {
    "use strict";

    var melbourneCenter = new google.maps.LatLng(-37.813942, 144.9711861);

    this.setupMapStyles();

    options = options || {};

    options.mapOptions = options.mapOptions || {
        center: melbourneCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,

        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        panControl: false,
        rotateControl: false,
        styles: this.mapStyles.iovation
    };

    this.mapOptions = options.mapOptions;

    this.markers = [];
    this.labels = [];
    this.currentZoom = 1;
    this.markerIcons = [];
    this.markerSize = 10;
    this.markersHidden = false;

    this.map = new google.maps.Map(document.getElementById(elementId), this.mapOptions);
    this.geocoder = new google.maps.Geocoder();
    this.infoWindow = new google.maps.InfoWindow();
    this.infoBox = new InfoBox({
        content: document.getElementById("infobox"),
        disableAutoPan: false,
        maxWidth: 440,
        pixelOffset: new google.maps.Size(-220, 0),
        zIndex: 6,
        /*boxStyle: {
            background: "url('http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/examples/tipbox.gif') no - repeat",
            opacity: 0.75 //,
                //width: "280px"
        },*/
        closeBoxURL: "",
        infoBoxClearance: new google.maps.Size(4, 4)
    });

    this.getMapPreference();

    var self = this;

    google.maps.event.addListener(self.map, 'zoom_changed', function () {
        self.checkSizeofMap();
        self.setZoomLevel();
    });


    if (typeof options.zoomChanged === "function") {
        google.maps.event.addListener(self.map, 'zoom_changed', function (e) {
            if (e === undefined) {
                e = self;
            }

            options.zoomChanged.apply(self, [e]);

        });

    }


    google.maps.event.addListener(self.map, 'idle', function () {
        self.resizeIcons();
    });


    if (typeof options.idle === "function") {
        google.maps.event.addListener(self.map, 'idle', function (e) {
            if (e === undefined) {
                e = self;
            }

            options.idle.apply(self, [e]);

        });

    }

    /* Enable custom styling when the infobox is displayed*/
    var lInfoBox = self.infoBox;
    google.maps.event.addListener(lInfoBox, 'domready', function () {
        var closeButt = document.getElementById("close-info-box");

        if (closeButt) {
            closeButt.addEventListener("click", function () {
                lInfoBox.setVisible(false);
                self.resetSelectedMarker();
            });
        }


    });


    //Attempt oto move map to current user coordinates
    self.geoLocate();


};

SMESGMap.prototype.localStorageAvailable = function () {
    "use strict";

    try {
        var storage = window.localStorage,
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

SMESGMap.prototype.getMapPreference = function () {
    "use strict";

    var storedData,
        self = this;

    if (!self.localStorageAvailable) {
        return;
    }

    storedData = window.localStorage.getItem('map-style');

    if (storedData) {
        self.changeMapStyle(storedData);
        self.mapStyleName = storedData;
    }


};


SMESGMap.prototype.saveStylePreference = function (stlyeName) {
    "use strict";

    if (!this.localStorageAvailable) {
        return;
    }


    try {
        window.localStorage.setItem('map-style', stlyeName);
    } catch (e) {
        //Give up
        console.log("Write to local storage failed");
    }

};

SMESGMap.prototype.geoLocate = function () {
    "use strict";

    var self = this;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                var geoPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                self.map.setCenter(geoPosition);
            },
            function (error) {
                console.log(error);
            });
    }

};



SMESGMap.prototype.getZoom = function () {
    "use strict";

    return this.map.getZoom();

};

/**
 * 
 * @param {None}.
 * @return {None}.
 */

SMESGMap.prototype.addMarker = function (marker) {
    "use strict";

    //Capture local reference of map for use in click functions
    var self = this;
    var markerLat, markerLng, markerTitle, markerIcon, nineFigureNo, infoWindowContent, eventListeners;

    markerLat = marker.lat;
    markerLng = marker.lng;
    markerTitle = marker.title;
    markerIcon = marker.icon;
    nineFigureNo = marker.nineFigureNo;
    infoWindowContent = marker.infoWindowContent;
    eventListeners = marker.eventListeners || null;


    var icon = {
        url: markerIcon + ".svg",
        size: new google.maps.Size(self.markerSize, self.markerSize),
        scaledSize: new google.maps.Size(self.markerSize, self.markerSize)
    };


    var mapMarker = new google.maps.Marker({
        position: new google.maps.LatLng(markerLat, markerLng),
        title: markerTitle,
        map: self.map,
        draggable: false,
        icon: icon,
        animation: google.maps.Animation.DROP,
        infoContent: infoWindowContent,
        nineFigureNo: nineFigureNo,
    });



    mapMarker.addListener('click', function () {
        //self.infoWindow.setContent(mapMarker.infoContent); //infoWindowContent);
        //self.infoWindow.open(self.map, this);
        var infoBoxEl = document.getElementById("infobox");
        infoBoxEl.innerHTML = mapMarker.infoContent;
        self.setSelectedMarker(mapMarker);
        self.infoBox.open(self.map, this);
        self.infoBox.setVisible(true);
        self.map.panTo(mapMarker.position);


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


    self.markers.push(mapMarker);

    //Check whether marker should be visible or not
    if (self.markersHidden) {
        mapMarker.setMap(null);
    }


};

SMESGMap.prototype.updateMarker = function (marker) {
    "use strict";

    //Capture local reference of map for use in click functions
    var self = this;

    var markerLat, markerLng, markerTitle, markerIcon, nineFigureNo, infoWindowContent, eventListeners;
    var mapMarker, icon;

    markerLat = marker.lat;
    markerLng = marker.lng;
    markerTitle = marker.title;
    markerIcon = marker.icon;
    nineFigureNo = marker.nineFigureNo;
    infoWindowContent = marker.infoWindowContent;


    for (var i = 0; i < self.markers.length; i++) {
        if (self.markers[i].nineFigureNo === nineFigureNo) {
            mapMarker = self.markers[i];
            break;
        }
    }

    //If a marker was found and defined continue processing
    if (mapMarker) {
        icon = {
            url: markerIcon + ".svg",
            size: new google.maps.Size(self.markerSize, self.markerSize),
            scaledSize: new google.maps.Size(self.markerSize, self.markerSize)
        };

        mapMarker.setIcon(icon);
        mapMarker.setPosition(new google.maps.LatLng(markerLat, markerLng));
        mapMarker.setTitle(markerTitle);
        mapMarker.infoContent = infoWindowContent;
    }

    for (var j = 0; j < self.markers.length; j++) {
        if (self.markers[j].nineFigureNo === nineFigureNo) {
            self.markers.splice(j, 1);
            break;
        }
    }

};

SMESGMap.prototype.setSelectedMarker = function (marker) {
    "use strict";

    var self = this;
    var icon = marker.icon;
    var url = icon.url;
    var newSize;

    self.resetSelectedMarker();

    //Ensure that the shadow version isn't already referenced
    url = url.replace("selected-", "");

    var lastSlash = url.lastIndexOf("/");

    url = url.substr(0, lastSlash + 1) + "selected-" + url.substr(lastSlash + 1);

    newSize = self.markerSize * 2;
    icon.scaledSize = new google.maps.Size(newSize, newSize);
    icon.size = new google.maps.Size(newSize, newSize);
    icon.url = url;

    marker.setIcon(icon);
    marker.isSelected = true;
};

SMESGMap.prototype.resetSelectedMarker = function () {
    "use strict";

    var self = this;
    var icon, url;

    for (var i = 0; i < self.markers.length; i++) {

        //Check if icon is larger and reset as necessary
        if (self.markers[i].isSelected) {
            icon = self.markers[i].icon;
            url = icon.url;

            //Ensure that the shadow version isn't referenced anymore for image
            url = url.replace("selected-", "");

            icon.scaledSize = new google.maps.Size(self.markerSize, self.markerSize);
            icon.size = new google.maps.Size(self.markerSize, self.markerSize);
            icon.url = url;

            self.markers[i].setIcon(icon);
            delete self.markers[i].isSelected;
        }
    }

};

SMESGMap.prototype.addLabel = function (label) {
    "use strict";

    var self = this;
    var labelContent, nineFigureNo, labelLat, labelLng;

    labelLat = label.lat;
    labelLng = label.lng;
    labelContent = label.label;
    nineFigureNo = label.nineFigureNo;

    var mapLabel = new MapLabel({
        text: labelContent,
        position: new google.maps.LatLng(labelLat, labelLng),
        map: self.map,
        minZoom: 19,
        fontFamily: "'Muli', sans-serif",
        strokeWeight: 6,
        fontColor: 'rgba(28, 43, 139, 0.87)',
        strokeColor: 'rgba(245, 245, 245, 0.87)',
        fontSize: 12,
        align: 'center',
        nineFigureNo: nineFigureNo
    });

    self.labels.push(mapLabel);


};

SMESGMap.prototype.updateLabel = function (label) {
    "use strict";

    var self = this;
    var labelContent, nineFigureNo, labelLat, labelLng;
    var mapLabel;

    labelLat = label.lat;
    labelLng = label.lng;
    labelContent = label.label;
    nineFigureNo = label.nineFigureNo;

    for (var i = 0; i < self.labels.length; i++) {
        if (self.labels[i].nineFigureNo === nineFigureNo) {
            mapLabel = self.labels[i];
            break;
        }
    }

    //If a marker was found and defined continue processing
    if (mapLabel) {
        mapLabel.set("text", labelContent);
        mapLabel.set("position", new google.maps.LatLng(labelLat, labelLng));
    }

};

SMESGMap.prototype.setZoomLevel = function () {
    "use strict";

    var self = this;
    var zoomLevel = this.map.getZoom();

    //If zoom level has changed, depending on old and new zoom levels marks need to be shown or hidden
    if (!self.zoomLevel || self.zoomLevel !== zoomLevel) {

        if (zoomLevel < 14 && (!self.zoomLevel || self.zoomLevel >= 14)) {
            self.hideMarkers();
            self.markersHidden = true;
        } else if (zoomLevel >= 14 && (!self.zoomLevel || self.zoomLevel < 14)) {
            self.showMarkers();
        }

        if (zoomLevel >= 14) {
            self.markerResizeRequired = true;
            self.markersHidden = false;
        }

    }

    //Reset zoomLevel
    self.zoomLevel = self.map.getZoom();
    self.markerSize = 9 + ((self.zoomLevel - 14) * 1.75);

};

SMESGMap.prototype.resizeIcons = function () {
    "use strict";

    var icon, newSize;
    var self = this;

    //Loop through the markers and re-szie their icons
    for (var markerCounter = 0; markerCounter < self.markers.length || 0; markerCounter++) {
        //Retrieve the marker icon and re-set its size
        icon = self.markers[markerCounter].icon;
        newSize = self.markerSize || 14;

        if (self.markers[markerCounter].isSelected) {
            newSize = newSize * 2;
        }

        icon.scaledSize = new google.maps.Size(newSize, newSize);
        icon.size = new google.maps.Size(newSize, newSize);

        //Update icon
        self.markers[markerCounter].setIcon(icon);
    }

};




SMESGMap.prototype.hideMarkers = function () {
    "use strict";

    var self = this;

    for (var i = 0; i < self.markers.length; i++) {
        self.markers[i].setMap(null);
    }

};

SMESGMap.prototype.showMarkers = function () {
    "use strict";

    var self = this;

    for (var i = 0; i < self.markers.length; i++) {
        self.markers[i].setMap(self.map);
    }

};


SMESGMap.prototype.hideLabels = function () {
    "use strict";

    var self = this;

    for (var i = 0; i < self.labels.length; i++) {
        self.labels[i].set('map', 'null');
    }


};

SMESGMap.prototype.showLabels = function () {
    "use strict";

    var self = this;

    for (var i = 0; i < self.labels.length; i++) {
        self.labels[i].set('map', self.map);
    }

};



SMESGMap.prototype.reverseGeocode = function (cLat, cLng) {
    "use strict";


    return new Promise(function (resolve, reject) {

        var latLng = {
            lat: cLat,
            lng: cLng
        };

        this.geocoder.geocode({
            'location': latLng
        }, function (results, status) {

            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    resolve(results[0].formatted_address);
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

SMESGMap.prototype.setUpAutoComplete = function (elementId) {
    "use strict";

    var self = this;
    var input = document.getElementById(elementId);
    var searchInfoWindow = new google.maps.InfoWindow();

    var searchMarker = new google.maps.Marker({
        map: self.map,
        anchorPoint: new google.maps.Point(0, -29)
    });

    self.autoComplete = new google.maps.places.Autocomplete(input);
    self.autoComplete.bindTo('bounds', self.map);


    self.autoComplete.addListener('place_changed', function () {
        searchInfoWindow.close();
        searchMarker.setVisible(false);
        var place = self.autoComplete.getPlace();

        if (!place.geometry) {
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            self.map.fitBounds(place.geometry.viewport);
        } else {
            self.map.setCenter(place.geometry.location);
            self.map.setZoom(17); // Why 17? Because it will likely be close enough to load marks.
        }

        //Add map icon
        //searchMarker.setIcon( /** @type {google.maps.Icon} */ 
        /*({
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35)
        }));*/
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
        searchInfoWindow.open(self.map, searchMarker);

    });

    searchMarker.addListener('click', function () {
        searchInfoWindow.open(self.map, searchMarker);
    });

};



SMESGMap.prototype.checkSizeofMap = function () {
    "use strict";

    var mapBoundsSouthWest = this.map.getBounds().getSouthWest();
    var mapCenter = this.map.getCenter();
    var self = this;

    if (typeof mapBoundsSouthWest !== 'undefined' && typeof mapCenter !== 'undefined') {
        var mapRadius = self.getDistanceKms(mapCenter.lat(), mapCenter.lng(), mapBoundsSouthWest.lat(), mapBoundsSouthWest.lng());

        self.mapSize = (mapRadius / 1000);
    } else {
        self.mapSize = 0;
    }


};

/**
 * Calculate the distance between two points in kilometres
 * @params {number} - coordinate values in latitude and longitude for the two points
 */
SMESGMap.prototype.getDistanceKms = function (point1Lat, point1Lng, point2Lat, point2Lng) {
    "use strict";

    var self = this;
    var R = 6378137; // Earth’s mean radius
    var dLat = self.calcRad(point2Lat - point1Lat);
    var dLong = self.calcRad(point2Lng - point1Lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(self.calcRad(point1Lat)) * Math.cos(self.calcRad(point2Lat)) *
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

    var self = this;
    var styleDetails;

    self.mapStyleName = styleName;

    if (styleName !== "google" && self.mapStyles[styleName]) {
        styleDetails = self.mapStyles[styleName];
    }

    self.map.setOptions({
        styles: styleDetails
    });

    self.saveStylePreference(styleName);
};

/**
  Map stlyes for use with Google maps
**/
SMESGMap.prototype.setupMapStyles = function () {
    "use strict";

    this.mapStyles = {
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

/*global xr, SMESGMap, SMESMarkStore, Promise, setTimeout, window, document, console, alert, ArrayBuffer, Uint8Array, Blob, saveAs, darkGrey, coolGrey, paleDawn, shiftWorker, simpleLight, muted, iovation, navigator, google, SMESMap, MarkStore, componentHandler */


//Variables for display
var loader;
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

    loader = document.querySelector("[id=loader]");
    zoomInMsg = document.querySelector("[id=zoom-in-msg]");
    errorMsg = document.querySelector("[id=error-msg]");
    locateButton = document.querySelector("[id=locate]");
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
    mapOptions.idle = requestMarkInformation;
    mapOptions.zoomChanged = displayZoomMessage;

    smesMap = new SMESGMap("map", mapOptions);
    markStore = new SMESMarkStore();
    smesMap.setUpAutoComplete("location-search", "clear-search-div");

    mobileOS = isMobile();

    loadMarks();


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

    showLoader();

    console.log("requestMarkInformation");

    markStore.requestMarkInformation(mapCenter.lat(), mapCenter.lng(), radius, loadMarks, displayZoomMessage);
    console.log(markStore.newIndex);

}

function showLoader() {
    loader.classList.remove("hidden");
}

function hideLoader() {
    loader.classList.add("hidden");
}


function displayZoomMessage() {

    var currentZoom = smesMap.getZoom();

    if (markStore.useLocalStore && currentZoom >= 14) {
        zoomInMsg.innerHTML = '<span class="zoom-in-message-text">Displaying cached marks - zoom to refresh</span>';
    } else {
        zoomInMsg.innerHTML = '<span class="zoom-in-message-text">Zoom to display marks</span>';
    }


    if (!smesMap.mapSize || smesMap.mapSize > 2 || currentZoom < 14 || markStore.tooManyMarks) {
        zoomInMsg.classList.remove("hidden");
    } else {
        zoomInMsg.classList.add("hidden");
    }
    hideLoader();
}

function loadMarks() {
    //Work through the new markers and add to the map, then work through updated markers and update on the map
    var surveyMark, address, markType, navigateString, infoWindowContent;

    console.log("loadMarks");

    var closeButton = '<button id="close-info-box" class="close-button mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon">' +
        '<i class="material-icons">close</i>' +
        '</button>';

    var cardDiv = '<div class="mdl-card infobox mdl-shadow--3dp overflow-x-visible">';
    var contentSDiv = '<div class="card-content"><div class="card-left">';
    var contentMDiv = '</div><div class="card-value">';
    var contentEDiv = '</div></div>';




    //Add new marks
    for (var n = 0; n < markStore.newIndex.length; n++) {

        var eventListeners = {};
        var marker = {};
        var label = {};

        surveyMark = markStore.markData[markStore.newIndex[n]].data;
        address = markStore.markData[markStore.newIndex[n]].address || '';
        markType = returnMarkType(surveyMark);

        if (mobileOS !== "") {
            navigateString = '<button id="navigate' + surveyMark.nineFigureNumber + '" class="smes-button mdl-button mdl-js-button mdl-js-ripple-effect fade-in">Navigate</button>';
        } else {
            navigateString = '';
        }


        eventListeners.domready = domReadyHandler(surveyMark.nineFigureNumber, surveyMark.name);
        eventListeners.click = markClickHandler(surveyMark.nineFigureNumber, parseFloat(surveyMark.latitude), parseFloat(surveyMark.longitude));


        infoWindowContent = cardDiv + '<div class="mdl-card__title mdl-color-text--white">' +
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
            '<div id="address' + surveyMark.nineFigureNumber + '"></div>' +

            '<div class="content-section">' +
            '<div class="content-icon"><i class="material-icons">swap_horiz</i></div>' +
            '<div class="content">' +
            contentSDiv + 'LL94:' + contentMDiv + surveyMark.latitude + ', ' + surveyMark.longitude + contentEDiv +
            contentSDiv + 'MGA:' + contentMDiv + surveyMark.zone + ', ' + surveyMark.easting + ', ' + surveyMark.northing + contentEDiv +
            contentSDiv + 'GDA94 technique:' + contentMDiv + surveyMark.gda94Technique + contentEDiv +
            contentSDiv + 'Ellipsoid height:' + contentMDiv + surveyMark.ellipsoidHeight + contentEDiv +
            contentSDiv + 'Uncertainty:' + contentMDiv + surveyMark.hUncertainty + contentEDiv +
            contentSDiv + 'Order:' + contentMDiv + surveyMark.hOrder + contentEDiv +
            contentSDiv + 'GDA94 measurements:' + contentMDiv + surveyMark.gda94Measurements + contentEDiv +
            '</div>' +
            '</div>' +
            '<div class="vert-spacer"></div>' +

            '<div class="content-section">' +
            '<div class="content-icon"><i class="material-icons">swap_vert</i></div>' +
            '<div class="content">' +
            contentSDiv + 'AHD height:' + contentMDiv + surveyMark.ahdHeight + contentEDiv +
            contentSDiv + 'AHD technique:' + contentMDiv + surveyMark.ahdTechnique + contentEDiv +
            contentSDiv + 'AHD uncertainty:' + contentMDiv + surveyMark.vUncertainty + contentEDiv +
            contentSDiv + 'AHD order:' + contentMDiv + surveyMark.vOrder + contentEDiv +
            contentSDiv + 'AHD level section:' + contentMDiv + surveyMark.ahdLevelSection + contentEDiv +
            '</div>' +
            '</div>' +

            '</div>' +
            '<div id="info-box-loader" class="hidden mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>' +
            '<div class="mdl-card__actions mdl-card--border">' +
            '<div class="horiz-spacer"></div>' +
            '<button id="sketch' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Sketch</button>' +
            '<button id="report' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Report</button>' +
            '</div></div>';

        marker.lat = surveyMark.latitude;
        marker.lng = surveyMark.longitude;
        marker.title = surveyMark.name;
        marker.icon = 'symbology/' + markType.iconName;
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
        markType = returnMarkType(surveyMark);


        infoWindowContent = cardDiv + '<div class="mdl-card__title mdl-color-text--white">' +
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
            '<div id="address' + surveyMark.nineFigureNumber + '"></div>' +

            '<div class="content-section">' +
            '<div class="content-icon"><i class="material-icons">swap_horiz</i></div>' +
            '<div class="content">' +
            contentSDiv + 'LL94:' + contentMDiv + surveyMark.latitude + ', ' + surveyMark.longitude + contentEDiv +
            contentSDiv + 'MGA:' + contentMDiv + surveyMark.zone + ', ' + surveyMark.easting + ', ' + surveyMark.northing + contentEDiv +
            contentSDiv + 'GDA94 technique:' + contentMDiv + surveyMark.gda94Technique + contentEDiv +
            contentSDiv + 'Ellipsoid height:' + contentMDiv + surveyMark.ellipsoidHeight + contentEDiv +
            contentSDiv + 'Uncertainty:' + contentMDiv + surveyMark.hUncertainty + contentEDiv +
            contentSDiv + 'Order:' + contentMDiv + surveyMark.hOrder + contentEDiv +
            contentSDiv + 'GDA94 measurements:' + contentMDiv + surveyMark.gda94Measurements + contentEDiv +
            '</div>' +
            '</div>' +
            '<div class="vert-spacer"></div>' +

            '<div class="content-section">' +
            '<div class="content-icon"><i class="material-icons">swap_vert</i></div>' +
            '<div class="content">' +
            contentSDiv + 'AHD height:' + contentMDiv + surveyMark.ahdHeight + contentEDiv +
            contentSDiv + 'AHD technique:' + contentMDiv + surveyMark.ahdTechnique + contentEDiv +
            contentSDiv + 'AHD uncertainty:' + contentMDiv + surveyMark.vUncertainty + contentEDiv +
            contentSDiv + 'AHD order:' + contentMDiv + surveyMark.vOrder + contentEDiv +
            contentSDiv + 'AHD level section:' + contentMDiv + surveyMark.ahdLevelSection + contentEDiv +
            '</div>' +
            '</div>' +

            '</div>' +
            '<div id="info-box-loader" class="hidden mdl-progress mdl-js-progress mdl-progress__indeterminate"></div>' +
            '<div class="mdl-card__actions mdl-card--border">' +
            '<div class="horiz-spacer"></div>' +
            '<button id="sketch' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Sketch</button>' +
            '<button id="report' + surveyMark.nineFigureNumber + '" class="mdl-button mdl-js-button mdl-js-ripple-effect smes-button fade-in">Report</button>' +
            '</div></div>';



        uMarker.lat = surveyMark.latitude;
        uMarker.lng = surveyMark.longitude;
        uMarker.title = surveyMark.name;
        uMarker.icon = 'symbology/' + markType.iconName;
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
    displayZoomMessage();
}

function markClickHandler(nineFigureNumber, lat, lng) {
    return function () {
        currentNineFigureNumber = nineFigureNumber;
        currentLatLng.lat = lat;
        currentLatLng.lng = lng;

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
