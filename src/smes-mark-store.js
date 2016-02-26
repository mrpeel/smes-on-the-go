/*global Promise, setTimeout, window, document, console, navigator, self, MouseEvent, Blob, FileReader, module, atob, Uint8Array, define */
/*global ReverseGeocoder, fetch, idb, IDBKeyRange */


var SMESMarkStore = function (storeOptions) {
    "use strict";

    var smesMarkStore = this;
    storeOptions = storeOptions || {};

    smesMarkStore.maxRequests = 12;
    smesMarkStore.perNumberOfSeconds = 60;
    smesMarkStore.lastStorageTimeStamp = Date.now();
    smesMarkStore.baseURL = 'https://maps.land.vic.gov.au/lvis/services/smesDataDelivery';
    smesMarkStore.tooManyMarks = false;
    smesMarkStore.cacheDays = storeOptions.cacheDays || 14;
    smesMarkStore.msecPerDay = 1000 * 60 * 60 * 24;
    smesMarkStore.markData = {};


    if (storeOptions.loadMark) {
        smesMarkStore.loadMark = storeOptions.loadMark;
    }

    if (storeOptions.finishedRetrieve) {
        smesMarkStore.finishedRetrieve = storeOptions.finishedRetrieve;
    }

    window.addEventListener("beforeunload", function (e) {
        // Do something
        smesMarkStore.executeSaveMarks();
    }, false);
};

SMESMarkStore.prototype.retrieveStoredMarks = function () {
    "use strict";

    var smesMarkStore = this;
    var storedData, mark;
    var comparisonMSec = Date.now() - (smesMarkStore.cacheDays * smesMarkStore.msecPerDay) + 1;

    if (!window.localStorage) {
        smesMarkStore.useLocalStore = false;
    } else {
        smesMarkStore.useLocalStore = true;
        var storedMarks = window.localStorage.getItem('smes-mark-data');
        if (storedMarks) {
            smesMarkStore.markData = JSON.parse(storedMarks);
        }

        var markKeys = Object.keys(smesMarkStore.markData);

        markKeys.forEach(function (nineFigureNumber) {
            if (smesMarkStore.markData[nineFigureNumber].lastUpdated > comparisonMSec) {
                smesMarkStore.loadMark.apply(smesMarkStore, [smesMarkStore.markData[nineFigureNumber], "new"]);
            } else {
                delete smesMarkStore.markData[nineFigureNumber];
            }

        });
    }

    //If a callback was specified, call it now
    if (smesMarkStore.finishedRetrieve) {
        smesMarkStore.finishedRetrieve.apply(smesMarkStore);
    }


};

SMESMarkStore.prototype.clearStoredMarks = function () {
    "use strict";

    var smesMarkStore = this;

    if (!smesMarkStore.useLocalStore) {
        return;
    } else {
        try {
            window.localStorage.removeItem('smes-mark-data');
        } catch (err) {
            console.log(err);
        }
    }

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

    //Set function to write storage after 1 minute.
    // if another write request comes in within 1 minute, smesMarkStore.lastStorageTimeStamp variable will have changed and the write will be aborted.
    window.setTimeout(function () {
        if (storageTimeStamp === smesMarkStore.lastStorageTimeStamp) {
            smesMarkStore.executeSaveMarks();

        }
    }, 60000);

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
            if (JSON.stringify(smesMarkStore.markData).length > 5000000) {
                culledMarkData = smesMarkStore.removeOldMarks(7);
            }

            //Check total size - if still >= 5MB then start culling - attempt to only store marks retrieved in the last day
            if (JSON.stringify(culledMarkData).length > 5000000) {
                culledMarkData = smesMarkStore.removeOldMarks(14);
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
    var comparisonMSec = Date.now() - (numberOfDays * smesMarkStore.msecPerDay) + 1;
    var newMarkData = smesMarkStore.markData;

    newMarkData.forEach(function (mark) {
        if (mark.lastUpdated < comparisonMSec) {
            delete newMarkData[mark.nineFigureNumber];
        }

    });

    return newMarkData;
};

SMESMarkStore.prototype.delayNextRequest = function () {
    "use strict";

    var smesMarkStore = this;

    //Set the last succesfull request in the future to prevent requests happening (clean-up if a 429 error has been triggered and need to back off)
    smesMarkStore.lastSuccesfullRetrieve = Date.now() + 20000;

};

SMESMarkStore.prototype.requestMarkInformation = function (requestOptions) {
    "use strict";

    var smesMarkStore = this;
    var currentRequestTimeStamp = new Date();
    //Set minimum time daly before executing web service request - this functions as a de-bounce operation
    var executionDelay = 500;

    //If an unacceptable radius has been supplied, don't call the service
    if (requestOptions.cRadius > 2) {
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
            smesMarkStore.retrieveMarkInformation(requestOptions.cLat, requestOptions.cLong, requestOptions.cRadius).then(function (marksRetrieved) {
                //Check data element is present, if so process it, and run the callback function
                if (marksRetrieved) {
                    smesMarkStore.processRetrievedMarks(marksRetrieved).then(function () {
                        console.log("Executing callback");
                        smesMarkStore.tooManyMarks = false;
                        requestOptions.finishedCallback.apply(smesMarkStore);
                    });

                }
            }).catch(function (err) {
                if (err === "Too many marks") {
                    smesMarkStore.tooManyMarks = true;
                    requestOptions.tooManyCallback.apply(smesMarkStore);
                } else {
                    requestOptions.errorCallback.apply(smesMarkStore);
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

    //check if retrieved data has been returned as an array - function exoects an array
    if (!Array.isArray(retrievedData)) {
        retrievedData = [retrievedData];
    }

    return new Promise(function (resolve, reject) {

        if (smesMarkStore.useLocalStore) {
            var tStamp = new Date();

            retrievedData.forEach(function (markData) {
                var matches;
                var loadType = "new";

                if (smesMarkStore.markData[markData.nineFigureNumber]) {
                    //Already have the mark - check if it's changed
                    var markKeys = Object.keys(markData);
                    loadType = "update";
                    matches = true;

                    for (var k = 0; k < markKeys.length; k++) {
                        //Work throught the returned data keys and compare the record to the db
                        if (markData[markKeys[k]] !== smesMarkStore.markData[markData.nineFigureNumber][markKeys[k]]) {
                            matches = false;
                            break;
                        }
                    }
                }

                if (matches) {
                    //Mark matches what we already have, so re-set last updated and move on
                    smesMarkStore.markData[markData.nineFigureNumber].lastUpdated = Date.now();

                } else {
                    //Don't have this mark, so add it and call the loading function
                    markData.lastUpdated = Date.now();
                    smesMarkStore.markData[markData.nineFigureNumber] = markData;
                    smesMarkStore.loadMark.apply(smesMarkStore, [markData, loadType]);
                }
            });

            //Trigger process to save marks into browser storage
            smesMarkStore.saveMarksToStorage();


            resolve(true);

        } else {
            //Not using record store, so just load it directly as a new mark
            retrievedData.forEach(function (markData) {
                smesMarkStore.loadMark.apply(smesMarkStore, [markData, "new"]);
            });

            resolve(true);
        }
    });
};


SMESMarkStore.prototype.setAddress = function (nineFigureNumber, address) {
    "use strict";

    var smesMarkStore = this;

    if (smesMarkStore.useLocalStore) {
        if (smesMarkStore.markData[nineFigureNumber]) {
            smesMarkStore.markData[nineFigureNumber].address = address;
        }
    }
};

SMESMarkStore.prototype.returnAddress = function (nineFigureNumber) {
    "use strict";

    var smesMarkStore = this;
    var address = "";

    if (smesMarkStore.useLocalStore) {
        if (smesMarkStore.markData[nineFigureNumber]) {
            address = smesMarkStore.markData[nineFigureNumber].address || "";
        }
    }

    return address;


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

        console.log("Fetching: " + smesMarkStore.baseURL + "/getMarkInformation?searchType=Location&latitude=" + cLat + "&longitude=" + cLong + "&radius=" + cRadius + "&format=Full");

        fetch(smesMarkStore.baseURL + "/getMarkInformation?searchType=Location&latitude=" + cLat + "&longitude=" + cLong + "&radius=" + cRadius + "&format=Full", {
                mode: 'cors'
            }).then(function (response) {
                return response.json();
            }).then(function (jsonResponse) {
                console.log("Response");
                console.log(jsonResponse);

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
                        resolve([]);
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
                reject(err);
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
