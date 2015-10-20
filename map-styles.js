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
