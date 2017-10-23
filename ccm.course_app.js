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
            'navComp':              ['ccm.load', 'https://moritzkemp.github.io/ccm-nav_tabs/resources/ccm.nav_tabs.js'],
            'navConfig':            {},
            'newsFeedComp':         ['ccm.load', 'https://moritzkemp.github.io/ccm-news_feed/resources/ccm.news_feed.js'],
            'newsFeedConfig':       {},
            'userComp':             ['ccm.load', 'https://akless.github.io/ccm-components/user/ccm.user.min.js'],
            'userConfig':           {},
            'tileComp':             ['ccm.load', 'https://moritzkemp.github.io/ccm-tile/resources/ccm.tile.js'],
            'tileLearningUnitConfig':           {
                "tiles": [
                    {
                        "headline":"Woche 1",
                        "subline":"Einführung in HTML und CSS",
                        "id":"week1"
                    },
                    {
                        "headline":"Woche 2",
                        "subline":"Einführung in Javascript",
                        "id":"week2"
                    },
                    {
                        "headline":"Woche 3",
                        "subline":"Einführung in das ccm-Framework",
                        "id":"week3"
                    }
                ]
            },
            'tileExerciseConfig':           {
                "tiles": [
                    {
                        "headline":"Übung 1",
                        "subline":"Einfache HTML Seite. Abgabe: 01.01.2017"
                    },
                    {
                        "headline":"Übung 2",
                        "subline":"Listen mit Javascript. Abgabe 03.02.2017"
                    },
                    {
                        "headline":"Übung 3",
                        "subline":"Einfache Komponente mit dem ccm-Framework. Abgabe 23.02.2017"
                    }
                ]
            },
            'learningUnitComp':     ['ccm.load', 'https://akless.github.io/ccm-components/le/versions/ccm.le-2.0.0.js'],
            'learningUnitConfig':   {},
            'appCSS':               ['ccm.load', './style.css'],
            'learningResources': {
                "week1" : ['ccm.load','./week1.js'],
                "week2" : ['ccm.load','./week2.js']
            },
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
                            "class":"exercise-area"
                        },
                        {
                            "tag":"div",
                            "class":"social-area"
                        }
                    ]
                }
            }
        },
        Instance : function(){
            let self = this;
            let my = {};

            this.ready = function( callback ){
                my = self.ccm.helper.privatize(self);
                if(callback) callback();
            };

            this.start = function( callback ){
                render();
                startComponents();
                if(callback) callback();
            };
            
            const render = function(){
                let navArea = self.ccm.helper.html(my.html.nav);
                self.element.appendChild(navArea);
                let contentArea = self.ccm.helper.html(my.html.content);
                self.element.appendChild(contentArea);
            };
            
            const startComponents = function(){
                // Start navigation
                my.navConfig.root = self.element.querySelector('.nav');
                my.navConfig.scroll_area = self.element.querySelector('.content');
                self.ccm.start(
                    my.navComp,
                    my.navConfig,
                    function( navInstance ){
                        my.navComp = navInstance;
                        let loginElem = getUserLoginElem();
                        my.navComp.setRightHeaderArea( loginElem );
                        
                        //Start user auth component
                        my.userConfig.root = loginElem;
                        my.userConfig.html = getUserButtonHTML();
                        my.userConfig.css = ['ccm.load', './userComp.css'];
                        my.userConfig.sign_on = "guest";
                        self.ccm.start(
                            my.userComp,
                            my.userConfig,
                            function( userInstance ){
                                my.userComp = userInstance;
                                
                                //Start news feed
                                my.newsFeedConfig.root = self.element.querySelector('.news-area');
                                my.newsFeedConfig.user = my.userComp;
                                self.ccm.start(
                                    my.newsFeedComp,
                                    my.newsFeedConfig,
                                    function( newsFeedInstance ){
                                        my.newsFeedComp = newsFeedInstance;
                                        
                                        // Set tab nav action to show this component
                                        my.navComp.setTabAction(
                                            "0", 
                                            ()=>{
                                                toggleWebsiteArea( my.newsFeedComp.root );
                                            }
                                        );
                                        // Set initial view to the news page
                                        toggleWebsiteArea(my.newsFeedComp.root);
                                    }
                                );
                            }
                        );
                        
                        //Start tile comp for learning units
                        my.tileLearningUnitConfig.root = self.element.querySelector('.learning-unit-overview-area');
                        self.ccm.start(
                            my.tileComp,
                            my.tileLearningUnitConfig,
                            function( tileInstance_1 ){
                                my.tileLearningUnit = tileInstance_1;
                                // Set tab nav action to show this component
                                my.navComp.setTabAction(
                                    "1", 
                                    ()=>{
                                        toggleWebsiteArea( my.tileLearningUnit.root );
                                    }
                                );
                                
                                my.tileLearningUnit.setAction("week1", function(){
                                    let leElem = self.ccm.helper.html( my.learningResources.week1 );
                                    let leArea = self.element.querySelector('.learning-unit-area');
                                    while (leArea.firstChild) {
                                        leArea.removeChild(leArea.firstChild);
                                    }
                                    leArea.appendChild(leElem);
                                    toggleWebsiteArea(self.element.querySelector('.learning-unit-area'));
                                });
                                
                                my.tileLearningUnit.setAction("week2", function(){
                                    let leElem = self.ccm.helper.html( my.learningResources.week2 );
                                    let leArea = self.element.querySelector('.learning-unit-area');
                                    while (leArea.firstChild) {
                                        leArea.removeChild(leArea.firstChild);
                                    }
                                    leArea.appendChild(leElem);
                                    toggleWebsiteArea(self.element.querySelector('.learning-unit-area'));
                                });
                            }
                        );
                        
                        //Start tile comp for exercises
                        my.tileExerciseConfig.root = self.element.querySelector('.exercise-area');
                        self.ccm.start(
                            my.tileComp,
                            my.tileExerciseConfig,
                            function( tileInstance_2 ){
                                my.tileExercise = tileInstance_2;
                                
                                // Set tab nav action to show this component
                                my.navComp.setTabAction(
                                    "2", 
                                    ()=>{
                                        toggleWebsiteArea( my.tileExercise.root );
                                    }
                                );
                            }
                        );
                    }
                );
            };
            
            const getUserLoginElem = function(){
                let el = document.createElement('div');
                el.classList.add('login');
                return el;
            };
            
            const getUserButtonHTML = function(){
                return {
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
