/*global Promise, setTimeout, window, document, console, navigator, self, MouseEvent, Blob, FileReader, module, atob, Uint8Array, define */
/*global ReverseGeocoder, xr */


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
        xr.get(self.baseURL + '/getMarkInformation', {
                searchType: "Location",
                latitude: cLat,
                longitude: cLong,
                radius: cRadius,
                format: "Full"
            })
            .then(function (jsonResponse) {

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
                if (xr.status === 0 && xr.response === "") {
                    self.delayNextRequest();
                    console.log("Too many requests");
                }
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
        xr.get(self.baseURL + '/getSurveyMarkSketches', {
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
        xr.get(self.baseURL + '/getSurveyMarkReports', {
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
