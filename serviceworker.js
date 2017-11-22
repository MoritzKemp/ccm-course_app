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
/* global self, fetch, caches, Promise */

/* --- Cache configs --- */
const CACHE_NAME = 'ccm-course-app-v8';
const cacheURLs = {
    // Course app statics
    'https://MoritzKemp.github.io/ccm-course_app/' :                                                                          'networkFailCache',
    'https://MoritzKemp.github.io/ccm-course_app/ccm.course_app.js' :                                                         'networkFailCache',
    
    // Router statics
    'https://moritzkemp.github.io/ccm-route_node/ccm.route_node.js' :               'cacheFailNetwork',
    
    // Nav tile statics
    'https://moritzkemp.github.io/ccm-tile/ccm.tile.js' :                           'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-tile/tile-default.css' :                      'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-tile/overall-default.css' :                   'cacheFailNetwork',
    
    // Nav tabs statics
    'https://moritzkemp.github.io/ccm-nav_tabs/ccm.nav_tabs.min.js' :               'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-nav_tabs/style.css' :                         'cacheFailNetwork',
    
    // User auth statics
    'https://akless.github.io/ccm-components/user/versions/ccm.user-2.0.0.min.js' : 'cacheFailNetwork',
    'https://MoritzKemp.github.io/ccm-course_app/userComp.css' :                                                              'cacheFailNetwork',
    
    // News feed statics
    'https://moritzkemp.github.io/ccm-news_feed/ccm.news_feed.min.js' :             'cacheFailNetwork',
    'https://moritzkemp.github.io/ccm-news_feed/style.css' :                        'cacheFailNetwork',
    
    // Kanban board statics
    'https://akless.github.io/ccm-components/kanban_board/versions/ccm.kanban_board-1.1.0.min.js' : 'cacheFailNetwork', 
    
    // Team building statics
    'https://akless.github.io/ccm-components/teambuild/versions/ccm.teambuild-1.0.0.min.js' : 'cacheFailNetwork'
};
/* --- IndexedDB configs */
const DB_NAME = "courseApp";
const DB_VERSION = "2";
const SEND_POST_STORE = "send-post-requests";
const GET_POSTS_STORE = "get-posts-requests";
let idb;
/* --- Message tags --- */
const MSG_FROM_PAGE_GET_POSTS = "get-posts";
const MSG_FROM_PAGE_SEND_POST = "send-post";
const MSG_TO_PAGE_GOT_POSTS = "got-posts";
const MSG_TO_PAGE_POSTS_SENT = "posts-sent";
const SYNC_SEND_POSTS = "send-posts";
const SYNC_GET_POSTS = "get-posts";

self.addEventListener('fetch', event =>{
    let requestURL = new URL( event.request.url );
    
    // Cache framework statics on demand
    if(/.*\/\/akless.github.io\/ccm\/.*/g.test(requestURL.href)){
        event.respondWith(
            caches.open(CACHE_NAME).then( (cache)=>{
                return cache.match(event.request).then( (cacheResponse)=>{
                    return cacheResponse || fetch(event.request).then( (networkResponse)=>{
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    } else {
        // Different caching strategies. Credit goes to Tal Ater, "Building Progressive Web Apps"
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
                    caches.match(event.request).then( (cacheResponse) =>{
                       return cacheResponse || fetch(event.request); 
                    })
                );
                break;
            case "networkFailCache":
                event.respondWith(
                    fetch(event.request).catch( () =>{
                       return caches.match(event.request);
                    })
                );
                break;
            case "cacheOnDemand":
                event.respondWith(
                    caches.open(CACHE_NAME).then( (cache)=>{
                        return cache.match(event.request).then( (cacheResponse)=>{
                            return cacheResponse || fetch(event.request).then( (networkResponse)=>{
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                        });
                    })
                );
                break;
            default:
                event.respondWith( 
                    fetch(event.request)
                );
        }
    }
});

self.addEventListener('install', event =>{
    event.waitUntil(
        caches.open(CACHE_NAME).then( (cache)=>{
           for(let entry in cacheURLs){
               cache.add(entry);
           }
       })
    );
});

self.addEventListener('activate', event =>{
    event.waitUntil(
        Promise.all([
            caches.keys()
            .then( (cacheNames) =>{
                return Promise.all(
                    cacheNames.map( (cacheName) =>{
                        if(CACHE_NAME !== cacheName && cacheName.startsWith("ccm-course-app-"))
                            return caches.delete(cacheName);
                    })
                );
            }),
            openDatabase(DB_NAME, DB_VERSION)
        ])
    );
});

self.addEventListener('sync', event =>{
    if(event.tag === SYNC_SEND_POSTS){
        event.waitUntil(
            objectStore(SEND_POST_STORE, 'readwrite')
            .then( (objectStore) =>{
                return getAllObjects(objectStore);
            })
            .then( (allObjects)=>{
                return Promise.all( allObjects.map( (object) =>{
                    return fetch( object.url )
                    .then(function( networkResponse ){
                        if( networkResponse.ok)
                            return deleteObject(object.id, SEND_POST_STORE);
                        else
                            return new Error("Could not send post with id: "+object.id);
                    })
                    .catch( () =>{
                         return new Error("Seems to be still offline.");
                    });
                }));
            })
            .then( ()=>{
                notifyPagesPostsSent();
            })
        );
    }
    if(event.tag === SYNC_GET_POSTS){
        event.waitUntil(
            objectStore(GET_POSTS_STORE, "readwrite")
            .then( (objectStore) =>{
                return getAllObjects(objectStore);
            })
            .then( (allObjects)=>{
                return Promise.all( allObjects.map( (object) =>{
                    return fetch(object.url)
                    .then( (response) =>{
                        if( response.ok){
                            deleteObject(object.id, GET_POSTS_STORE);
                            return response.json();
                        }
                        else
                            new Error("Could not perform get-posts-request with id:"+object.id);
                    })
                    .then( (posts) =>{
                        notifyPagesGotPosts(posts);
                    })
                    .catch( () =>{
                        return new Error("Seems to be still offline.");
                    });
                }));
            })
        );
    }
});

self.addEventListener('message', event =>{
    console.log("[SW-Course-App] Message: ", event);
    switch(event.data.tag){
        case MSG_FROM_PAGE_SEND_POST:
            sendNewPost(event.data.url);
            break;
        case MSG_FROM_PAGE_GET_POSTS:
            getPosts(event.data.url);
            break;
        default:
            console.log("No handler in sw for event:", event);
    }
});

// Sends a new post object to a remote store
// If offline, stores post object and registers back-sync
const sendNewPost = (url) =>{
    // 1. Try to send post object to remote store
    fetch(url)
    .then( (response) =>{
    // 2. If successfull, send message to client
        notifyPagesPostsSent();
    })
    .catch( () =>{
    // 3. If offline, store in IndexedDB
        objectStore(SEND_POST_STORE, "readwrite")
        .then((objectStore)=>{
            addObject( 
                objectStore,
                {
                    "url":  url,
                    "id":   Math.floor((Math.random()*1000)+1)
                }
            );
        })
        .then(()=>{
           // 4. Register back-sync
            self.registration.sync.register(SYNC_SEND_POSTS);
        })
        .catch((error)=>{
            console.log("Error: ", error);
        });
    });
};

// Gets all posts from remote store
// If offline, stores request and registers back-sync
const getPosts = (url) =>{
    // 1. Try to send post object to remote store
    fetch(url)
    .then( (response) =>{
        return response.json();
    })
    .then( (posts) =>{
        // 2. If successfull, send message with data to client
        notifyPagesGotPosts(posts);
    })
    .catch( ()=>{
        // 3. If offline, store in IndexedDB
        objectStore(GET_POSTS_STORE, "readwrite")
        .then((objectStore)=>{
            addObject( 
                objectStore,
                {
                    "url":  url,
                    "id":   Math.floor((Math.random()*1000)+1)
                }
            );
        })
        .then(()=>{
           // 4. Register back-sync
            self.registration.sync.register(SYNC_GET_POSTS);
        })
        .catch((error)=>{
            console.log("Error: ", error);
        });
    });
};

const notifyPagesPostsSent = () =>{
    self.clients.matchAll({includeUncontrolled: true}).then(function( clients ){ 
        clients.forEach(function( client ){
            client.postMessage(
                {
                    "tag": MSG_TO_PAGE_POSTS_SENT
                }
            );
        });
    });
};

const notifyPagesGotPosts = (posts) =>{
    self.clients.matchAll({includeUncontrolled: true}).then(function( clients ){ 
        clients.forEach(function( client ){
            client.postMessage(
                {
                    "tag": MSG_TO_PAGE_GOT_POSTS,
                    "posts": posts
                }
            );
        });
    });
};


/* --- Database functions */
/* Inspired from "Building Progressive Web Apps", Tal Ater */

const openDatabase = function(dbName, dbVersion){
    return new Promise(( resolve, reject )=>{
        const request = self.indexedDB.open(dbName, dbVersion);
        request.onerror = function( event ){
            reject("Database error: " + event.target.error);
        };
        request.onupgradeneeded = function( event ){
            let db = event.target.result;
            db.createObjectStore(GET_POSTS_STORE, {keyPath: "id", autoIncrement: true});
            db.createObjectStore(SEND_POST_STORE, {keyPath: "id", autoIncrement: true});
            idb = db;
        };
        request.onsuccess = function( event ){
            idb = event.target.result;
            resolve( event.target.result);
        };
    });
};

const objectStore = function( storeName, transactionMode ){
    return new Promise((resolve, reject )=>{
        let objectStore = {};
        if(!idb){
            openDatabase(DB_NAME, DB_VERSION).then(()=>{
                objectStore = idb
                    .transaction(storeName, transactionMode)
                    .objectStore(storeName);
                    
                resolve(objectStore);
            });
        } else {
            objectStore = idb
                .transaction(storeName, transactionMode)
                .objectStore(storeName);
            resolve(objectStore);
        }
    });
};

const addObject = function( objectStore, object ){
    return new Promise(( resolve, reject)=>{
        const request = objectStore.add(object);
        request.onsuccess = resolve;
    });
};

const getAllObjects = function( objectStore ){
    return new Promise( function(resolve, reject){
        let request = objectStore.getAll();
        request.onsuccess = function( event ){
            resolve(event.target.result);
        };
        request.onerror = function( ){
            reject("Could not get all posts: "+request.error);
        };
    });
};

const deleteObject = function( key, objectStoreName ){
    return new Promise( (resolve, reject)=>{
        objectStore(objectStoreName, "readwrite").then(function( objectStore ){
            objectStore.delete(key).onsuccess = function( event ){
                console.log("Delete successfull:", key);
                resolve("Successfull delete key: "+ key);
            };
        });
    });
};

