/*global self, caches, Promise, URL, location, fetch */

var staticCacheName = 'smes-otg-v1460981221626';
var preCache = [
                'material.min.css',
                'material.min.js',
                'smes-on-the-go.css',
                'sotg-lib.min.js',
                'smes-on-the-go.js',
                'favicon.ico',
                'symbology/ahdapprox-pm.png',
                'symbology/gda94approx-pm.png',
                'symbology/scn-gda94-ahd-pm.png',
                'symbology/scn-gda94-ahdapprox-pm.png',
                'symbology/scn-gda94-pm.png',
                'symbology/scn-ahd-pm.png',
                'symbology/scn-gda94-pcm.png',
                'symbology/selected-ahdapprox-pm.png',
                'symbology/selected-gda94approx-pm.png',
                'symbology/selected-scn-ahd-pm.png',
                'symbology/selected-scn-gda94-ahd-pm.png',
                'symbology/selected-scn-gda94-ahdapprox-pm.png',
                'symbology/selected-scn-gda94-pcm.png',
                'symbology/selected-scn-gda94-pm.png'
            ];
var opaqueCacheOnRequest = [
                'https://fonts.gstatic.com',
                'https://fonts.googleapis.com'
            ];

self.addEventListener('install', function (event) {
    //When cache is installed add everything in the pre-cache list
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(preCache);
        })
    );
});

self.addEventListener('activate', function (event) {
    //On activation ,delet any previous version of the smes-otg cache
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('smes-otg-') && cacheName !== staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    //Check if URL is opaque and should be cached on request
    for (var prefixCounter = 0; prefixCounter < opaqueCacheOnRequest.length; prefixCounter++) {
        if (event.request.url.startsWith(opaqueCacheOnRequest[prefixCounter])) {
            opaqueCacheOnFirstRequest(event.request);
            break;
        }
    }

    //The default behaviour is to check if it's in the cache, and either serve it from the cache or the network request
    event.respondWith(checkCacheAndRespond(event.request));
});

function checkCacheAndRespond(request) {
    return caches.match(request).then(function (response) {
        return response || fetch(request);
    });
}

function opaqueCacheOnFirstRequest(request) {

    /*Opaque URLs fail when attempting to work with the response object
       so for these URLs, if they are not already cached, they are added with a call to add
    */
    return caches.open(staticCacheName).then(function checkCache(cache) {
        cache.match(request).then(function (response) {
            if (!response) {
                cache.add(request.url);
            }
        });

    });
}


self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
