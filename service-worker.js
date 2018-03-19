/**
 * Service worker for CloudsdaleFM 
 * Don't move it to any directory, it has to stay in /
 */
"use strict";
var cacheName = "sw-cache-cdfm-v8"
var cacheStaticFiles = [
    "/manifest.json",
    "/favicon.png",
    "/ie.js"
]
var cacheDynamic = [
    /\/images\//g,
    /\/videos\//g,
    /\/fonts\/.*\.woff2/g,
    /\/player\/images\//g
] // regex
var neverCache = [
    "/stream"
]

self.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll(cacheStaticFiles)
        })
    )
})

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(cacheNames.map(name => {
                if(name !== cacheName) {
                    console.log('[ServiceWorker]',"Removing old cached files from",name)
                    return caches.delete(name)
                }
            }))
        })
    )
})

self.addEventListener("fetch", function(e) {
    var request = e.request

    if((request.cache === "no-cache")
    || (request.cache === "no-store") 
    || (request.cache === "only-if-cached" && request.mode !== 'same-origin')
    ) return;

    if(request.cache === "reload") {
        e.respondWith(
            caches.open(cacheName).then(function (cache) {
                if(cacheDynamic.some(function(v) { return v.test(request.url) })) {
                    return fetch(request).then(function (response) {
                        var responseClone = response.clone();
                        cache.put(request, responseClone)
                        return response
                    })
                } 
                return fetch(request)
            })
        )
        return;
    }

    if(neverCache.some(function(v) { return request.url.includes(v) })) return;

    e.respondWith(
        caches.open(cacheName).then(function (cache) {
            return cache.match(request).then(function (response) {
                if(response) return response
                if(cacheDynamic.some(function(v) { return v.test(request.url) })) {
                    return fetch(request).then(function (response) {
                        var responseClone = response.clone();
                        cache.put(request, responseClone)
                        return response
                    })
                } 
                return fetch(request)
            })
        })
    )
})
