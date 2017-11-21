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

(function(){
    var component = {
        name: 'course_app',
        ccm: 'https://akless.github.io/ccm/ccm.js',
        config: {
            'nav_tabs': [
                'ccm.load', 
                'https://moritzkemp.github.io/ccm-nav_tabs/ccm.nav_tabs.min.js'
            ],
            'nav_tabs_config':{
                "header_text"   : 'WE Master', 
                "tabs": [
                    {
                        "text"   : "News",
                        "route"  : "/news"
                    },
                    {
                        "text"   : "Phasen",
                        "route"  : "/phasen"
                    },
                    {
                        "text"   : "Übungen",
                        "route"  : "/uebungen"
                    },
                    {
                        "text"   : "Social",
                        "route"  : "/social"
                    }
                ]
            },
            'news_feed': [
                'ccm.load', 
                'https://moritzkemp.github.io/ccm-news_feed/ccm.news_feed.min.js'
            ],
            'news_feed_config':{},
            'user': [
                'ccm.load', 
                'https://akless.github.io/ccm-components/user/versions/ccm.user-2.0.0.min.js'
            ],
            'user_config':{},
            'tile': [
                'ccm.load', 
                'https://moritzkemp.github.io/ccm-tile/ccm.tile.js'
            ],
            'tile_phases_config':{},
            'tile_exercises_config':{},
            'tile_social_config':{},
            'kanban_board':['ccm.load', 'https://akless.github.io/ccm-components/kanban_board/versions/ccm.kanban_board-1.1.0.min.js'],
            'kanban_board_config':{},
            'learning_resources': {},
            'style': ['ccm.load', 'https://MoritzKemp.github.io/ccm-course_app/style.css'],
            'html':{
                "nav" : {
                    "tag":"div",
                    "class":"nav"
                },
                "content": {
                    "tag":"div",
                    "class":"content",
                    "inner": [
                        {
                            "tag":"div",
                            "class":"news-area"
                        },
                        {
                            "tag":"div",
                            "class":"learning-unit-overview-area"
                        },
                        {
                            "tag":"div",
                            "class":"learning-unit-area"
                        },
                        {
                            "tag":"div",
                            "class":"exercise-overview-area"
                        },
                        {
                            "tag":"div",
                            "class":"exercise-area"
                        },
                        {
                            "tag":"div",
                            "class":"social-overview-area"
                        },
                        {
                            "tag":"div",
                            "class":"kanban-board-area"
                        }
                    ]
                },
                "loginArea":{
                    "tag": "div",
                    "class": "login"
                },
                'loginButton':{
                    "logged_in" : {
                        "tag"   : "div",
                        "class" : "unlocked",
                        "inner" : [
                            {
                                "tag":"button",
                                "class": "logout-btn",
                                "inner": "Abmelden",
                                "onclick":"%click%"
                            }
                        ]
                    },
                    "logged_out" : {
                        "tag"   : "div",
                        "class" : "locked",
                        "inner" : [
                            {
                                "tag":"button",
                                "class": "login-btn",
                                "inner": "Anmelden",
                                "onclick":"%click%"
                            }
                        ]
                    }
                }
            }
        },
        Instance : function(){
            let self = this;
            let my = {};
            
            this.ready = function( callback ){
                my = self.ccm.helper.privatize(self);
                callback();
            };

            this.start = function( callback ){
                registerServiceWorker();
                render();
                startInitialComponents();
                if(callback) callback();
            };
            
            const registerServiceWorker = function(){
                if("serviceWorker" in navigator){
                    navigator.serviceWorker.register('https://MoritzKemp.github.io/ccm-course_app/serviceworker.js');
                } else {
                    console.log("No SW support here.");
                }
            };
            
            const render = function(){
                let navArea = self.ccm.helper.html(my.html.nav);
                self.element.appendChild(navArea);
                let contentArea = self.ccm.helper.html(my.html.content);
                self.element.appendChild(contentArea);
            };
            
            const startInitialComponents = function(){
                let loginArea = self.ccm.helper.html(my.html.loginArea);
                my.nav_tabs_config.root = self.element.querySelector('.nav');
                my.nav_tabs_config.scroll_area = self.element;
                my.nav_tabs_config.tabs[0].action = ()=>{toggleWebsiteArea(self.element.querySelector('.news-area'));};
                my.nav_tabs_config.tabs[1].action = ()=>{toggleWebsiteArea(self.element.querySelector('.learning-unit-overview-area'));};
                my.nav_tabs_config.tabs[2].action = ()=>{toggleWebsiteArea(self.element.querySelector('.exercise-overview-area'));};
                my.nav_tabs_config.tabs[3].action = ()=>{toggleWebsiteArea(self.element.querySelector('.social-overview-area'));};
                my.nav_tabs_config.router = [
                    "ccm.start", 
                    "https://moritzkemp.github.io/ccm-route_node/ccm.route_node.js",
                    {
                        "isRoot": true
                    }
                ];
                self.ccm.start(
                    my.nav_tabs,
                    my.nav_tabs_config,
                    (instance)=>{
                        self.nav_tabs = instance;
                        instance.setRightHeaderArea(loginArea);
                        startNewsFeed();
                        startPhasesTiles();
                        startExercisesTiles();
                        startSocialTiles();
                    }
                );
                
                
                const startNewsFeed = function(){
                    
                    my.user_config.root = loginArea;
                    my.user_config.css = ["ccm.load", "https://MoritzKemp.github.io/ccm-course_app/userComp.css"];
                    my.user_config.html = my.html.loginButton;
                    my.news_feed_config.root = self.element.querySelector('.news-area');
                    my.news_feed_config.user = [
                        "ccm.instance", 
                        "https://akless.github.io/ccm-components/user/ccm.user.min.js",
                        my.user_config
                    ];
                    self.ccm.start(
                        my.news_feed,
                        my.news_feed_config,
                        (instance)=>{
                            self.news_feed = instance;
                        }
                    );    
                };
                
                const startPhasesTiles = function(){
                    my.tile_phases_config.root = self.element.querySelector('.learning-unit-overview-area');
                    my.tile_phases_config.router = [
                        "ccm.start", 
                        "https://moritzkemp.github.io/ccm-route_node/ccm.route_node.js",
                        {
                            "prevNode": {
                                "node": self.nav_tabs.router,
                                "route": "/phasen"
                            }
                        }
                    ];
                    let leArea = self.element.querySelector('.learning-unit-area');
                    if(my.tile_phases_config.tiles){
                        my.tile_phases_config.tiles.forEach((tile)=>{
                            tile.action = ()=>{
                                let currentLeElem = self.ccm.helper.html(my.learning_resources[tile.id]);
                                while(leArea.firstChild){
                                    leArea.removeChild(leArea.firstChild);
                                }
                                leArea.appendChild(currentLeElem);
                                toggleWebsiteArea(leArea);
                            };
                        });
                    }
                    self.ccm.start(
                        my.tile,
                        my.tile_phases_config,
                        (instance)=>{
                            self.tile_social = instance;
                        }
                    );
                };
                
                const startExercisesTiles = function(){
                    my.tile_exercises_config.root = self.element.querySelector('.exercise-overview-area');
                    let exerciseArea = self.element.querySelector('.exercise-area');
                    if(my.tile_exercises_config.tiles){
                        my.tile_exercises_config.tiles.forEach((tile)=>{
                            tile.action = ()=>{
                                let currentLeElem = self.ccm.helper.html(my.learning_resources[tile.id]);
                                while(exerciseArea.firstChild){
                                    exerciseArea.removeChild(exerciseArea.firstChild);
                                }
                                exerciseArea.appendChild(currentLeElem);
                                toggleWebsiteArea(exerciseArea);
                            };
                        });
                    }
                    my.tile_exercises_config.router = [
                        "ccm.start", 
                        "https://moritzkemp.github.io/ccm-route_node/ccm.route_node.js",
                        {
                            "prevNode": {
                                "node": self.nav_tabs.router,
                                "route": "/uebungen"
                            }
                        }
                    ];
                    self.ccm.start(
                        my.tile,
                        my.tile_exercises_config,
                        (instance)=>{
                            self.tile_exercises = instance;
                        }
                    );
                };
                
                const startSocialTiles = function(){
                    my.tile_social_config.root = self.element.querySelector('.social-overview-area');
                    my.tile_social_config.router = [
                        "ccm.start", 
                        "https://moritzkemp.github.io/ccm-route_node/ccm.route_node.js",
                        {
                            "prevNode": {
                                "node": self.nav_tabs.router,
                                "route": "/social"
                            }
                        }
                    ];
                    let kanbanArea = self.element.querySelector('.kanban-board-area');
                    my.kanban_board_config.root = kanbanArea;
                    self.ccm.start(
                        my.kanban_board,
                        my.kanban_board_config
                    );
                    
                    my.tile_social_config.tiles[0].action = ()=>{
                        toggleWebsiteArea(kanbanArea);
                    };
                    self.ccm.start(
                        my.tile,
                        my.tile_social_config,
                        (instance)=>{
                            self.tile_social = instance;
                        }
                    );
                };
            };
            
            
            const toggleWebsiteArea = function( desiredActiveContent ){
                let contentArea = self.element.querySelector('.content');
                for(var i=0; i<contentArea.children.length; i++){
                    contentArea.children[ i ].classList.add('hidden');
                }
                desiredActiveContent.classList.remove('hidden');
            };     
        }
    };
    
    //The following code gets the framework and registers component from above
    function p(){window.ccm[v].component(component);}
    var f="ccm."+component.name+(component.version?"-"+component.version.join("."):"")+".js";if(window.ccm&&null===window.ccm.files[f])window.ccm.files[f]=component;else{var n=window.ccm&&window.ccm.components[component.name];n&&n.ccm&&(component.ccm=n.ccm),"string"==typeof component.ccm&&(component.ccm={url:component.ccm});var v=component.ccm.url.split("/").pop().split("-");if(v.length>1?(v=v[1].split("."),v.pop(),"min"===v[v.length-1]&&v.pop(),v=v.join(".")):v="latest",window.ccm&&window.ccm[v])p();else{var e=document.createElement("script");document.head.appendChild(e),component.ccm.integrity&&e.setAttribute("integrity",component.ccm.integrity),component.ccm.crossorigin&&e.setAttribute("crossorigin",component.ccm.crossorigin),e.onload=function(){p(),document.head.removeChild(e)},e.src=component.ccm.url}} 
}());
