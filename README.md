# SMES On The Go
SMES On The Go is a mobile optimised web application for accesing Victorian survey mark data.  Survey mark data is retrieved 
from Land victoria and displayed on a Google map.  SMES On The Go:
* allows searching for a location / address using Google maps
* displays survey marks on the map 
* retrieves and displays detailed survey mark information
* retrieves PDFs for the mark report and mark sketch for a survey mark
* retrieves nearest address for a survey mark from Google Maps
* caches downloaded survey mark data for 2 weeks
* allows a choice of base map styles 

#Technologies used
SMES On The Go runs entirely in the browser and uses service worker to cache the application locally (not in iOS as it currently
doesn't support service worker).  Local storage caches retrieved mark information.  Network conenctivitiy is still required as
the Google Maps API cannot be locally cached.  

SMES On The Go uses:
* Google Maps Javascript API: Display of the base map, searching for addresses/places, reverse geo-coding
* Fetch API: retrieiving mark data and PDFs from Land Victoria
* Service worker: caching source files locally and managing updates
* Loca storage: caching survey mark data
* fileSaver.js: saving PDF files locally
* Material Design Lite: card based information display

#Licence
MIT
