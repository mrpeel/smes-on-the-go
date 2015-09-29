function convertDMStoDecimal(dms) {
    var decimalPos = 0;
    var degreesVal, minutesVal, secondsVal;
    var numberSecondDecimals, divisionFactor;

    var dmsString = String(dms);

    //Check for decimal point
    decimalPos = dmsString.indexOf(".");

    if (decimalPos > 0) {
        //Retrieve degrees
        degreesVal = parseFloat(dmsString.substr(0, decimalPos));
        //Remove degrees component from string
        dmsString = dmsString.substr(decimalPos + 1);

        //Retrieve minutes
        minutesVal = parseFloat(dmsString.substr(0, 2));
        //Remove minutes component from string
        dmsString = dmsString.substr(2);

        //Retrieve whole seconds
        secondsVal = parseFloat(dmsString.substr(0, 2));
        //Remove whole seconds component from string
        dmsString = dmsString.substr(2);

        //Check how many decimals are present within seconds
        numberSecondDecimals = dmsString.length;

        if (numberSecondDecimals > 0) {
            //Calculate how much to divde the number by to get decimal component
            divisionFactor = Math.pow(10, numberSecondDecimals);
            //Create decimal component and add to seconds
            secondsVal = secondsVal + (parseFloat(dmsString) / divisionFactor);
        }

        //Now construct it all together as decimal degrees
        if (degreesVal >= 0) {
            return degreesVal + (minutesVal / 60) + (secondsVal / 3600);
        } else {
            return degreesVal - (minutesVal / 60) - (secondsVal / 3600);
        }


    } else {
        //No decimal point so nothing to do
        return dms;
    }

}