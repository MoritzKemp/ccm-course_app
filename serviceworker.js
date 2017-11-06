/* 
 * The MIT License
 *
 * Copyright 2017 Moritz Kemp <moritz at kemp-thelen.de>.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/* global self, fetch, caches */

const storesToHandle = [
    'moritz_kemp_news_feed'
];

const CACHE_NAME = 'ccm-course-app-v1';
const cacheURLs = {
    //TODO index.hmtl etc
    
    'https://akless.github.io/ccm/ccm.min.js' :                                   'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-nav_tabs/resources/ccm.nav_tabs.min.js' :   'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-nav_tabs/resources/style.css' :             'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-news_feed/ccm.news_feed.min.js' :           'cacheFailNetwork',
    'https://akless.github.io/ccm-components/user/ccm.user.min.js' :              'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-tile/resources/ccm.tile.js' :               'cacheFailNetwork'
};

self.addEventListener('fetch', event=>{
    let requestURL = new URL(event.request.url);
    switch( cacheURLs[requestURL.href] ){
        case "cacheOnly":
            event.respondWith(
                caches.match(event.request)
            );
            break;
        case "networkOnly":
            event.respondWith(
                fetch(event.request)
            );
            break;
        case "cacheFailNetwork":
            event.respondWith(
                caches.match(event.request).then(function( cacheResponse ){
                   return cacheResponse || fetch(event.request); 
                })
            );
            break;
        case "networkFailCache":
            event.respondWith(
                fetch(event.request).catch(function( ){
                   return caches.match(event.request);
                })
            );
            break;
        default:
            event.respondWith( 
                fetch(event.request)
            );
    }
});

// Start caching as soon as possible
self.addEventListener('install', event=>{
    event.waitUntil(
        caches.open(CACHE_NAME).then(( cache )=>{
            for(let entry in cacheURLs){
                fetch(entry).then(
                    cache.add(entry)
                );
            }
        })
    );
});

// Delete opsolete caches from previous service-workers of this app
self.addEventListener('active', event=>{
    event.waitUntil(
        caches.keys().then(function( cacheNames ){
            return Promise.all(
                cacheNames.map(function( cacheName ){
                    if(CACHE_NAME !== cacheName && cacheName.startsWith("ccm-course-app-"))
                        return caches.delete(cacheName);
                })
            );
        })
    );
});

/* --- Background-sync for news feed --- */

self.addEventListener('sync', event=>{
    if( event.tag === 'add-post'){
        event.waitUntil(()=>{
            return getNewPosts().then( newPosts=>{
               return Promise.all(
                    newPosts.map( post=>{
                        return fetch( getNewsFeedRequest(post) ).then(()=>{
                           return deletePostFromQueue(); 
                        });
                    })
                ); 
            });
        });
    }
});

const getNewPosts = function(){
    return Promise((resolve, reject)=>{
       // Get new posts from IndexedDB 
    });
};

const getNewsFeedRequest = function( post ){
    return Request(
        'https://ccm.inf.h-brs.de',
        {
            body: JSON.stringify(post),
        }
    ); 
};
