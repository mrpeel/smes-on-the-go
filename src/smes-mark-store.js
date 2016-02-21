/*global Promise, setTimeout, window, document, console, navigator, self, MouseEvent, Blob, FileReader, module, atob, Uint8Array, define */
/*global ReverseGeocoder, fetch */


var SMESMarkStore = function () {
    "use strict";

    var smesMarkStore = this;

    smesMarkStore.useLocalStore = smesMarkStore.localStorageAvailable();
    smesMarkStore.maxRequests = 15;
    smesMarkStore.perNumberOfSeconds = 60;
    smesMarkStore.lastStorageTimeStamp = Date.now();
    smesMarkStore.baseURL = 'https://maps.land.vic.gov.au/lvis/services/smesDataDelivery';
    smesMarkStore.updateIndex = [];
    smesMarkStore.newIndex = [];
    smesMarkStore.tooManyMarks = false;

    if (smesMarkStore.useLocalStore) {
        smesMarkStore.retrieveStoredMarks();
    } else {
        smesMarkStore.markData = {};
    }


    //Add a before unload event to write marks to storage
    window.addEventListener("beforeunload", function (e) {
        // Do something
        smesMarkStore.executeSaveMarks();
    }, false);

    //After current processing is finished, remove any marks older than 14 days
    window.setTimeout(function () {
        smesMarkStore.markData = smesMarkStore.removeOldMarks(14);
    }, 0);
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

    var smesMarkStore = this;
    var storedData, mark;

    if (!smesMarkStore.useLocalStore) {
        return;
    }

    storedData = window.localStorage.getItem('smes-mark-data');

    if (storedData) {
        smesMarkStore.markData = JSON.parse(storedData);
        //Add all marks to the new mark index - to ensure they will get loaded to the UI
        for (mark in smesMarkStore.markData) {
            smesMarkStore.newIndex.push(mark);
        }

    } else {
        smesMarkStore.markData = {};
    }




};

SMESMarkStore.prototype.clearStoredMarks = function () {
    "use strict";

    var smesMarkStore = this;

    if (!smesMarkStore.useLocalStore) {
        return;
    }

    window.localStorage.removeItem('smes-mark-data');

};

SMESMarkStore.prototype.saveMarksToStorage = function () {
    "use strict";

    var smesMarkStore = this;

    if (!smesMarkStore.useLocalStore) {
        return;
    }

    var storageTimeStamp;

    //Set timestamp for last storage
    smesMarkStore.lastStorageTimeStamp = Date.now();
    storageTimeStamp = smesMarkStore.lastStorageTimeStamp;

    //Set function to write storage after 5 minutes.
    // if another write request comes in within 5 minutes, smesMarkStore.lastStorageTimeStamp variable will have changed and the write will be aborted.
    window.setTimeout(function () {
        if (storageTimeStamp === smesMarkStore.lastStorageTimeStamp) {
            smesMarkStore.executeSaveMarks();

        }
    }, 300000);

};

SMESMarkStore.prototype.executeSaveMarks = function () {
    "use strict";

    var culledMarkData;
    var smesMarkStore = this;

    try {
        window.localStorage.setItem('smes-mark-data', JSON.stringify(smesMarkStore.markData));
        console.log("Data written to local storage");
    } catch (e) {
        try {
            //Check total size - if >= 5MB then start culling - attempt to only store marks retrieved within the last 7 days
            if (JSON.stringify(culledMarkData).length > 5000000) {
                culledMarkData = smesMarkStore.removeOldMarks(7);
            }

            //Check total size - if still >= 5MB then start culling - attempt to only store marks retrieved in the last day
            if (JSON.stringify(culledMarkData).length > 5000000) {
                culledMarkData = smesMarkStore.removeOldMarks(7);
            }

            window.localStorage.setItem('smes-mark-data', JSON.stringify(culledMarkData));
        } catch (e) {
            //Give up
            console.log("Write to local storage failed");
        }
    }
};

SMESMarkStore.prototype.removeOldMarks = function (numberOfDays) {
    "use strict";

    var smesMarkStore = this;
    var individualMark;
    var comparisonDate;
    var newMarkData = smesMarkStore.markData;

    for (individualMark in newMarkData) {
        if (smesMarkStore.isNumberOfDaysOld(newMarkData[individualMark].lastUpdated, numberOfDays)) {
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

    var smesMarkStore = this;

    //Set the last succesfull request in the future to prevent requests happening (clean-up if a 429 error has been triggered and need to back off)
    smesMarkStore.lastSuccesfullRetrieve = Date.now() + 20000;

};

SMESMarkStore.prototype.requestMarkInformation = function (cLat, cLong, cRadius, callback, tooManyCallback) {
    "use strict";

    var smesMarkStore = this;
    var currentRequestTimeStamp = new Date();
    //Set minimum time daly before executing web service request - this functions as a de-bounce operation
    var executionDelay = 500;

    //If an unacceptable radius has been supplied, don't call the service
    if (cRadius > 2) {
        return;
    }

    //Record the last request queued time
    smesMarkStore.lastQueuedTimeStamp = currentRequestTimeStamp;
    var minInterval = (smesMarkStore.perNumberOfSeconds / smesMarkStore.maxRequests) * 1000;


    //If there has already been a request to the server, make sure this request doesn't execute until the minimum interval time
    if (smesMarkStore.lastSuccesfullRetrieve) {
        //Calulate the interval since tghe last request went through
        var currentInterval = currentRequestTimeStamp - smesMarkStore.lastSuccesfullRetrieve;

        //Reset execution delay to the remaining interval plus the standard execution delay
        if (currentInterval < minInterval) {
            executionDelay = minInterval - currentInterval + executionDelay;
        }
    }

    //Execute the logic after the appropriate wait
    window.setTimeout(function () {
        //Check if this is still the most recently queued request
        if (currentRequestTimeStamp === smesMarkStore.lastQueuedTimeStamp) {
            console.log("Processing request");
            smesMarkStore.lastSuccesfullRetrieve = new Date();
            smesMarkStore.retrieveMarkInformation(cLat, cLong, cRadius).then(function (marksRetrieved) {
                //Check data element is present, if so process it, and run the callback function
                if (marksRetrieved) {
                    smesMarkStore.processRetrievedMarks(marksRetrieved).then(function () {
                        console.log("Executing callback");
                        smesMarkStore.tooManyMarks = false;
                        callback.apply(this);
                    });

                }
            }).catch(function (err) {
                if (err === "Too many marks") {
                    smesMarkStore.tooManyMarks = true;
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

    var smesMarkStore = this;
    var dataObject, objectProp;

    return new Promise(function (resolve, reject) {


        //reset indexes of new and updates marks
        smesMarkStore.updateIndex = [];
        smesMarkStore.newIndex = [];

        //console.log("Mark count: " + smesMarkStore.countMarks());

        for (var i = 0; i < retrievedData.length; i++) {
            dataObject = retrievedData[i];

            //Check whether this mark is already in the store
            if (!smesMarkStore.markData[dataObject.nineFigureNumber]) {
                //Don't have mark, so add it
                smesMarkStore.addUpdateValueInStore(dataObject);
                smesMarkStore.newIndex.push(dataObject.nineFigureNumber);

            } else {
                //Already have this mark - Check whether the mark was last retrieved within a day
                if (smesMarkStore.isNumberOfDaysOld(smesMarkStore.markData[dataObject.nineFigureNumber].lastUpdated || 0, 1)) {
                    //Check whether mark information has changed
                    if (JSON.stringify(dataObject) !== JSON.stringify(smesMarkStore.markData[dataObject.nineFigureNumber].data)) {
                        //data has changed so store data, store hash, remove address, and update lastUpdated
                        smesMarkStore.addUpdateValueInStore(dataObject);
                        smesMarkStore.updateIndex.push(dataObject.nineFigureNumber);
                    } else {
                        //Latest data is the same so change the lastUpdated value to now
                        smesMarkStore.markData[dataObject.nineFigureNumber].lastUpdated = Date.now();
                    }
                }

            }

        }

        resolve(true);

        //console.log("Mark count: " + smesMarkStore.countMarks());

        //Trigger process to save marks into browser storage
        smesMarkStore.saveMarksToStorage();

    });


};


SMESMarkStore.prototype.countMarks = function () {
    "use strict";

    var smesMarkStore = this;
    var objectProp;
    var markCounter = 0;


    //Simple concatenation of the properties of the object - up to 24 vals
    for (objectProp in smesMarkStore.markData) {
        markCounter += 1;
    }

    return markCounter;
};

SMESMarkStore.prototype.addUpdateValueInStore = function (dataObject) {
    "use strict";

    var smesMarkStore = this;

    if (!smesMarkStore.markData[dataObject.nineFigureNumber]) {
        smesMarkStore.markData[dataObject.nineFigureNumber] = {};
    }

    smesMarkStore.markData[dataObject.nineFigureNumber].data = dataObject;
    delete smesMarkStore.markData[dataObject.nineFigureNumber].address;
    smesMarkStore.markData[dataObject.nineFigureNumber].lastUpdated = Date.now();

};

SMESMarkStore.prototype.setAddress = function (nineFigureNumber, address) {
    "use strict";

    var smesMarkStore = this;

    smesMarkStore.markData[nineFigureNumber].address = address;

};

SMESMarkStore.prototype.returnAddress = function (nineFigureNumber) {
    "use strict";

    var smesMarkStore = this;

    var surveyMark = smesMarkStore.markData[nineFigureNumber] || null;
    return surveyMark.address || "";

};


/**
 * Call the getMarkInfornmation web service.  
 * @param {number} cLat, cLong - the coordinates for the center of the radius to search in
 * @return {promise} a promise which will resolve a data structure which contains the mark information 
 */
SMESMarkStore.prototype.retrieveMarkInformation = function (cLat, cLong, cRadius) {
    "use strict";

    var smesMarkStore = this;

    return new Promise(function (resolve, reject) {

        /*xr.get(smesMarkStore.baseURL + '/getMarkInformation', {
                searchType: "Location",
                latitude: cLat,
                longitude: cLong,
                radius: cRadius,
                format: "Full"
            })*/
        fetch(smesMarkStore.baseURL + "/getMarkInformation?searchType=Location&latitude=" + cLat + "&longitude=" + cLong + "&radius=" + cRadius + "&format=Full", {
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
                smesMarkStore.delayNextRequest();
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

    var smesMarkStore = this;

    return new Promise(function (resolve, reject) {
        fetch(smesMarkStore.baseURL + "/getSurveyMarkSketches?returnDefective=true&markList=" + nineFigureNumber, {
                mode: 'cors'
            }).then(function (response) {
                return response.json();
            })
            /*xr.get(smesMarkStore.baseURL + '/getSurveyMarkSketches', {
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

    var smesMarkStore = this;

    return new Promise(function (resolve, reject) {
        /*xr.get(smesMarkStore.baseURL + '/getSurveyMarkReports', {
                markList: nineFigureNumber,
                returnDefective: true
            })*/
        fetch(smesMarkStore.baseURL + "/getSurveyMarkReports?returnDefective=true&markList=" + nineFigureNumber, {
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
