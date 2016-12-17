angular.module('FlightClub', ['ngMaterial', 'ngCookies', 'ngMessages', 'ngRoute', 'ngAnimate', 'ngAria', 'ngSanitize']);
angular.module('FlightClub').config(function ($routeProvider, $locationProvider, $mdThemingProvider) {

    $mdThemingProvider.definePalette('primaryPalette', $mdThemingProvider.extendPalette('pink', {
        '500': '181c1f', // grey for navbar
        '600': '424e57' // hover on sites
    }));

    $mdThemingProvider.definePalette('accentPalette', $mdThemingProvider.extendPalette('green', {
        '500': 'ccac55', // accents in dark()
        '200': 'ccac55', // gold for selected options (hover)
        '600': 'ccac55', // gold for selected options
        'A200': 'ccac55', // gold for selected tab underline, radio on
        'A700': 'ccac55' // hover on selected grid tile
    }));
    
    $mdThemingProvider.theme('fc_default')
            .backgroundPalette('grey')
            .primaryPalette('primaryPalette')
            .accentPalette('accentPalette')
    ;
    
    $mdThemingProvider.theme('fc_dark')
            .primaryPalette('primaryPalette')
            .accentPalette('accentPalette')
            .dark()
    ;
    
    $mdThemingProvider.alwaysWatchTheme(true);

    $locationProvider.html5Mode(true);
    $routeProvider
            .when("/", {templateUrl: "/pages/home.html", controller: "HomeCtrl"})
            .when("/build/", {templateUrl: "/pages/build.html", controller: "BuildCtrl", reloadOnSearch: false})
            .when("/account/", {templateUrl: "/pages/account.html", controller: "AccountCtrl"})
            .when("/docs/", {controller: function () {
                    window.location.replace('/docs/');
                }, template: "<div></div>"})
            .when("/contact/", {templateUrl: "/pages/contact.html", controller: "ContactCtrl"})
            .when("/donate/", {templateUrl: "/pages/donate.html", controller: "DonateCtrl"})
            .when("/error/", {templateUrl: "/pages/error.html", controller: "ErrorCtrl"})
            .when("/results/", {templateUrl: "/pages/results.html", controller: "ResultsCtrl", reloadOnSearch: false})
            .when("/media/", {templateUrl: "/pages/media.html", controller: "MediaCtrl"})
            .when("/world/", {templateUrl: "/pages/world.html", controller: "WorldCtrl", reloadOnSearch: false})
            .otherwise({redirectTo: '/'});
});

angular.module('FlightClub').directive('int', function () {
    return {
        require: 'ngModel',
        link: function (scope, ele, attr, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
                return parseInt(viewValue, 10);
            });
        }
    };
});

angular.module('FlightClub').directive('float', function () {
    return {
        require: 'ngModel',
        link: function (scope, ele, attr, ctrl) {
            ctrl.$parsers.unshift(function (viewValue) {
                return parseFloat(viewValue, 10);
            });
        }
    };
});
angular.module('FlightClub').controller('IndexCtrl', function ($scope, $mdSidenav, $cookies, $location, $window, $interval) {
    
    var base, port;
    if($location.host() === 'localhost') {
        base= 'http://localhost';
        port = ':8080';
    } else {
        base = '//www.flightclub.io';
        port = ':8443';
    }
    $scope.client = base;
    $scope.server = base + port + '/FlightClub';
    var api_url = $scope.server + '/api/v1';
    
    $scope.cookies = {
        AUTHTOKEN: 'fc_authToken',
        BLANKCANVASINFO: 'fc_bcInfo',
        SIMCOUNT: 'fc_simCount',
        THEME: 'fc_theme'
    };

    $scope.token = $cookies.get($scope.cookies.AUTHTOKEN);
    $scope.authorised = false;
    $scope.permissions = [];
    $scope.canCreateUser = false;
    
    $scope.showSidenav = true;
    $scope.$on('viewBroadcast', function(event, args) {
        $scope.isBuilder = args === 'build';
        $scope.showSidenav = (args === 'build' || args === 'results' || args === 'world');
    });

    $scope.httpRequest = function (dest, method, data, successfn, errorfn) {
        $.ajax({type: method, url: api_url + dest, contentType: 'application/json', data: data,
            dataType: "json", xhrFields: {withCredentials: false}, headers: {},
            success: successfn, error: errorfn
        });
    };

    if ($scope.token !== undefined) {
        var data = JSON.stringify({auth: {token: $scope.token}});
        $scope.httpRequest('/auth/', 'POST', data, function (data) {
            $scope.authorised = data.auth;
            
            data.permissions.split(",").forEach(function(el) {
                $scope.permissions.push(el.toLowerCase());
            });
            $scope.canCreateUser = $scope.hasPermission('createUser');
            
            if (!$scope.authorised) {
                $cookies.remove($scope.cookies.AUTHTOKEN);
            }
        });
    }

    var themer = $interval(function() {
        if ($scope.theme)
            $interval.cancel(themer);
        else {
            $scope.theme = $cookies.get($scope.cookies.THEME);
            if($scope.theme === undefined)
                $scope.theme = 'fc_dark';
        }
    }, 100);        

    $scope.parseQueryString = function (queryString)
    {
        var pairs = queryString.split("&");
        var paramMap = {};
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split("=");
            paramMap[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return paramMap;
    };

    $scope.redirect = function (path) {
        $location.url(path);
    };

    $scope.redirectExternal = function (path) {
        $window.location.href = path;
    };


    $scope.toggleNav = function (id) {
        $mdSidenav(id).toggle();
    };

    $scope.open = function (id) {
        $mdSidenav(id).open();
    };

    $scope.close = function (id) {
        $mdSidenav(id).close();
    };
    
    $scope.hasPermission = function(toCheck) {
        var ret = false;
        toCheck = toCheck.toLowerCase();
        $scope.permissions.forEach(function(p) {
            if(p === "all" || p === toCheck)
                ret = true;
        });
        return ret;
    };
    
    $scope.toggleTheme = function() {
        $scope.theme = $scope.theme === 'fc_dark' ? 'fc_default' : 'fc_dark';
        $cookies.put($scope.cookies.THEME, $scope.theme);
    };
    
    $scope.supports_html5_storage = function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };
});
angular.module('FlightClub').controller('AccountCtrl', function ($timeout, $document, $scope, $cookies) {

    $scope.$emit('viewBroadcast', 'login');
    $scope.$parent.toolbarTitle = 'Flight Club | Account';

    $scope.forms = [];
    // hack to fix password label not detecting input on Chrome 
    // https://github.com/angular/material/issues/1376
    $timeout(function () {
        var elem = angular.element($document[0].querySelector('input[type=password]:-webkit-autofill'));
        if (elem.length) {
            elem.parent().addClass('md-input-has-value');
        }
    }, 150);
    
    $scope.httpRequest('/user/permissions', 'GET', null, function (data) {
        var list = data.data;
        $scope.permissions = {};
        for (var i = list.length; i > 0; i--) {
            $scope.permissions[list[i - 1].code] = {code: list[i - 1].code, name: list[i - 1].name};
        }
    }, function(data, statusText) {
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.alerts[2] += 'Permissions: ' + statusText + '\n';
    });
    
    $scope.capitalise = function(string) {
        return string === undefined ? undefined : string.charAt(0).toUpperCase() + string.slice(1);
    };

    $scope.alerts = [];
    $scope.loginToggle = function () {
        if (!$scope.$parent.authorised) {
            
            var data = JSON.stringify($scope.forms[0]);
            $scope.$parent.httpRequest('/user/login', 'POST', data, function (data) {
                if (data.Success) {
                    var now = new Date();
                    var expiryDate = new Date(now.getTime() + 1000 * parseInt(data.Success.maxAge));

                    $cookies.put($scope.$parent.cookies.AUTHTOKEN, data.Success.authToken, {'expires': expiryDate});
                    $scope.$parent.token = data.Success.authToken;
                    $scope.$parent.authorised = true;
            
                    $scope.$parent.permissions.length = 0;
                    data.Success.permissions.split(",").forEach(function (el) {
                        $scope.$parent.permissions.push(el.toLowerCase());
                    });
                    
                    $scope.alerts[0] = "Successfully logged in!";
            
                } else {
                    $scope.alerts[0] = data.error;
                }
                $scope.forms[0] = {};
                $scope.$apply();
            }, function (data) {
                $scope.alerts[0] = data.error;
                $scope.$apply();
            });
    
        } else {
            $cookies.remove($scope.$parent.cookies.AUTHTOKEN);
            $scope.$parent.authorised = false;
            $scope.$parent.permissions.length = 0;
            $scope.$parent.token = undefined;
            $scope.alerts[0] = "Successfully logged out!";
        }
    };
    
    $scope.updatePassword = function () {
        $scope.forms[1].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[1]);
        $scope.forms[1].auth = {token: ''};
        $scope.$parent.httpRequest('/user/updatePass', 'POST', data, function (data) {
            if (data.Success) {
                $scope.alerts[1] = 'Password updated successfully!';
            } else {
                $scope.alerts[1] = data.error;
            }
            $scope.forms[1] = {};
            $scope.$apply();
        }, function (data) {
            $scope.alerts[1] = 'Error sending request\n'+data.error;
            $scope.$apply();
        });
    };
    
    $scope.create = function () {
        $scope.forms[2].auth = {token: $scope.$parent.token};
        var data = JSON.stringify($scope.forms[2]);
        $scope.forms[2].auth = {token: ''};
        $scope.$parent.httpRequest('/user/new', 'POST', data, function (data) {
            if (data.Success) {
                $scope.alerts[2] = 'User \"' + $scope.forms[2].Create.new.username + '\" created successfully!';
            } else {
                $scope.alerts[2] = data.error;
            }
            $scope.forms[2] = {};
            $scope.$apply();
        }, function (data) {
            $scope.alerts[2] = 'Error sending request\n'+data.error;
            $scope.$apply();
        });
    };
});
angular.module('FlightClub').controller('BuildCtrl', function ($scope, $mdDialog, $mdSidenav, $cookies, $interval, $timeout, $location, $mdPanel, $mdMedia) {

    $scope.$parent.toolbarClass = "";
    $scope.$emit('viewBroadcast', 'build');

    $scope.missionLoading = true;
    $scope.loadSuccess = false;
    
    $scope.export_icon = 'content_copy';
    $scope.exportStyle = false;
    $scope.import_icon = 'content_paste';
    $scope.importStyle = false;
    $scope.save_icon = 'save';
    $scope.saveStyle = false;
    $scope.saving = false;
    $scope.loadingMission = false;
    
    $scope.serverErrorMessage = 'The flightclub.io server has undergone a rapid unscheduled disassembly :/\n'
            + 'You\'ll need to wait until I wake up and see this...\n\n';
    $scope.messageArray = [
        // p is probability of update being skipped until next interval
        { p: 0.7, message: 'Getting data from /r/SpaceX...' },
        { p: 0.5, message: 'Killing Church...' },
        { p: 0.7, message: 'Rebuilding Amos-6...' },
        { p: 0.2, message: 'Turtling FoxhoundBat...' },
        { p: 0.2, message: 'YVAN EHT NIOJ' },
        { p: 0.2, message: 'Impersonating Benjamin Klein...' },
        { p: 0.9, message: '<a href="https://www.patreon.com/flightclub">Click here to support me on Patreon!</a>'},
        { p: 0.6, message: 'Wake up, John...' },
        { p: 0.1, message: 'SUBLIMINAL MESSAGES' },
        { p: 0.8, message: 'In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.' },
        { p: 0.8, message: '☠☠☠ Give it up jiggy make it feel like foreplay / Yo my cardio is infinite / Ha ha / Big willie style\'s all in it / Gettin jiggy wit it / Na na na na na na na nana ☠☠☠'}
    ];
    
    var i = Math.floor(Math.random()*$scope.messageArray.length);
    var roller = $interval(function() {
        $scope.missionLoadingMessage = $scope.messageArray[i].message;
        if (Math.random() > $scope.messageArray[i].p) {
            i = (i+1)%$scope.messageArray.length;
        }
        if(!$scope.missionLoading) {
            $interval.cancel(roller);
        }
    }, 350);
    
    $scope.queryParams = $scope.$parent.parseQueryString(window.location.search.substring(1));
    $scope.runTutorial = $scope.queryParams.runTutorial!==undefined;
    if($scope.runTutorial)
        $scope.tutorialStep = $scope.queryParams.step!==undefined ? parseInt($scope.queryParams.step) : 0;
    
    $scope.httpRequest('/missions', 'GET', null, function (data) {
        fillMissions(data);
    }, function(data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Missions: ' + statusText + '\n';
    });
    $scope.httpRequest('/launchsites', 'GET', null, function (data) {
        $scope.launchSites = fill(data);
    }, function(data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'LaunchSites: ' + statusText + '\n';
    });
    $scope.httpRequest('/stages?engineDetail=true', 'GET', null, function (data) {
        $scope.stageTypes = fillStages(data);
    }, function(data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Stages: ' + statusText + '\n';
    });
    $scope.httpRequest('/engines', 'GET', null, function (data) {
        $scope.engineTypes = fillStages(data);
    }, function(data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Engines: ' + statusText + '\n';
    });
    $scope.httpRequest('/companies', 'GET', null, function (data) {
        $scope.companies = fill(data);
    }, function(data, statusText) {
        $scope.missionLoading = false;
        $scope.$parent.toolbarTitle = 'It usually works, I swear';
        $scope.serverErrorMessage += 'Companies: ' + statusText + '\n';
    });

    $scope.gravTurnSelect = [
        {code: 'NONE', name: null},
        {code: 'FORWARD', name: 'Forward'},
        {code: 'REVERSE', name: 'Reverse'}
    ];

    $scope.type = [
        {code: 'IGNITION', name: 'Ignition'},
        {code: 'CUTOFF', name: 'Cutoff'},
        {code: 'GUIDANCE', name: 'Guidance'},
        {code: 'LAUNCH', name: 'Launch'},
        {code: 'SEPARATION', name: 'Stage Separation'},
        {code: 'FAIRING_SEP', name: 'Fairing Separation'},
        {code: 'PAYLOAD_SEP', name: 'Payload Separation'}
    ];

    var fillMissions = function (data) {
        var list = data.data;

        $scope.allMissions = [];
        $scope.upcoming = [];
        $scope.past = [];

        for (var i = list.length; i > 0; i--) {
            var mission = list[i - 1];
            var missionObj = {code: mission.code, name: mission.description, display: mission.display};
            var tempDate = Date.parse(mission.date.replace(/-/g, "/") + ' ' + mission.time + ' UTC');

            if (tempDate > new Date()) {
                $scope.allMissions.push(missionObj);
                $scope.upcoming.push(missionObj);
            } else {
                $scope.allMissions.push(missionObj);
                $scope.past.push(missionObj);
            }
        }

        var missionObj;
        if ($scope.upcoming.length > 0) {
            missionObj = $scope.upcoming[$scope.upcoming.length - 1];
        } else {
            missionObj = $scope.past[0];
        }
        $scope.selectedMission = missionObj;
        $scope.loadSuccess = true;
        $scope.missionLoading = false;
        
        var formHash = $location.hash();
        if ($scope.runTutorial) {
            $scope.processTutorial($scope.tutorialStep);
        } else if (formHash) {
            var formData = window.atob(formHash);
            $scope.form = JSON.parse(formData);
            setNewMission($scope.form.Mission.code);            
        } else if (!$cookies.get($scope.$parent.cookies.BLANKCANVASINFO)) {
            var confirm = $mdDialog.confirm()
                    .title("Welcome!")
                    .textContent(
                        'You have a blank canvas in front of you. ' +
                        'To load up a pre-built mission, use the menu in the top-right corner.'
                    )
                    .ariaLabel('Blank Canvas Info')
                    .ok('Ok')
                    .cancel('Don\'t show me this again');
            $mdDialog.show(confirm).then(function () {
            }, function () {
                $cookies.put($scope.$parent.cookies.BLANKCANVASINFO, '1');
            });
        }

    };
    
    $scope.tutorialSteps = [
        {id: 1, num: 0, delay: 0, cont: true, title: 'Flight Club Tutorial', done: 'Yeah! :D'},
        
        {id: 1, num: 1, delay: 0, cont: false, title: 'Selecting Pre-built Missions', done: 'Ok', el: '.sidenav-open', x: $mdPanel.xPosition.OFFSET_START, y: $mdPanel.yPosition.ALIGN_TOPS},
        
        {id: 1, num: 2, delay: 1000, cont: true, title: 'Selecting a Launch Site', done: 'Tell me more'},
        {id: 2, num: 2, delay: 0, cont: false, title: 'Selecting a Launch Site', done: 'Ok', el: $('md-tab-item')[0], x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 3, num: 2, delay: 350, cont: false, title: 'Selecting a Launch Site', done: 'This is gonna be good'},
        
        {id: 1, num: 3, delay: 1000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.vehicleRadio1', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 2, num: 3, delay: 0, cont: false, title: 'Building a Rocket', done: 'Ok', el: '.vehicleRadio2', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 3, num: 3, delay: 1000, cont: true, title: 'Building a Rocket', done: 'Tell me more', el: '.addEngines', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        {id: 4, num: 3, delay: 0, cont: false, title: 'Building a Rocket', done: 'Ok'},
        
        {id: 1, num: 4, delay: 1000, cont: true, title: 'Building a Flight Profile', done: 'Tell me more', el: '.events', x: $mdPanel.xPosition.ALIGN_START, y: $mdPanel.yPosition.BELOW},
        
        {id: 1, num: 5, delay: 0, cont: true, title: 'Flight Club Tutorial', done: 'Woo!'}
    ];
    
    $scope.processTutorial = function (step) {

        if (!$scope.runTutorial || step !== $scope.tutorialStep)
            return;

        if ($scope.tutorialStep < $scope.tutorialSteps.length) {
            var step = $scope.tutorialSteps[$scope.tutorialStep];
            setTimeout(function() {
                $mdPanel.open(getTutorialPane(step.el, step.x, step.y));
            }, step.delay);
        }

    };
    
    var getTutorialPane = function(element, x, y) {
        
        var position = element === undefined ? 
                $mdPanel.newPanelPosition()
                    .absolute()
                    .top($mdMedia('xs')?'10%':'25%')
                    .left($mdMedia('xs')?'10%':'25%') :
                $mdPanel.newPanelPosition()
                    .relativeTo(element)
                    .addPanelPosition(x, y);

        var config = {
            attachTo: angular.element(document.body),
            controller: function (mdPanelRef, $scope, lTheme, lSteps, lStepId, lParentScope) {
                $scope.steps = lSteps;
                $scope.step = $scope.steps[lStepId];
                $scope.getOtherTheme = function () {
                    return lTheme === 'fc_dark' ? 'fc_default' : 'fc_dark';
                };
                $scope.quit = function () {
                    lParentScope.runTutorial = false;
                    mdPanelRef.close();
                };
                $scope.next = function () {
                    mdPanelRef.close();
                    lParentScope.tutorialStep++;
                    if($scope.step.cont) {
                        lParentScope.processTutorial(lParentScope.tutorialStep);
                    }
                };
            },
            templateUrl: '/pages/tutorial.tmpl.html',
            panelClass: 'tutorial-dialog-panel',
            position: position,
            clickOutsideToClose: true,
            locals: {
                lTheme: $scope.$parent.theme,
                lSteps: $scope.tutorialSteps,
                lStepId: $scope.tutorialStep,
                lParentScope: $scope
            }
        };
        return config;
    };

    var fill = function (data) {
        var list = data.data;
        var array = {};
        for (var i = list.length; i > 0; i--) {
            array[list[i - 1].code] = {code: list[i - 1].code, name: list[i - 1].description};
        }
        return array;
    };

    var fillStages = function (data) {
        var list = data.data;
        var array = {};
        for (var i = list.length; i > 0; i--) {
            array[list[i - 1].id] = list[i - 1];
        }
        return array;
    };
    
    $scope.updateUrl = function() {
        if($scope.form) {
            var formAsJSON_string = JSON.stringify($scope.form);

            var formHash = window.btoa(formAsJSON_string);
            $location.hash(formHash);
            return formHash;
        }
    };
    
    $scope.$watch('form', function() {
        $scope.updateUrl();
    }, true);

    $scope.selectMission = function (mission) {
        $scope.selectedMission = mission;
        $scope.loadingMission = true;
        $scope.httpRequest('/missions/' + mission.code, 'GET', null, function (data) {
            $mdSidenav("sidenav").close();
            $scope.loadingMission = false;
            $scope.form = JSON.parse(data);
            setNewMission(mission.code);
            if ($scope.runTutorial && mission.code === 'IRD1') {
                $scope.processTutorial(2);
            }
        }, null);
    };
    
    var setNewMission = function (code) {
        $scope.sortEvents();
        $scope.$parent.toolbarTitle = $scope.form.Mission.description;
        $scope.selectedEvent = null;
        $scope.builderType = 'previous';
        $scope.selectedVeh = code;
        $scope.recalcDV();
    };

    $scope.selectMissionVehicle = function (code) {
        $scope.httpRequest('/missions/' + code, 'GET', null, function (data) {
            var tempForm = JSON.parse(data);
            
            var currentStages = $scope.form.Mission.Vehicle.Stages.length;
            var newStages = tempForm.Mission.Vehicle.Stages.length;
            
            $scope.form.Mission.Vehicle = tempForm.Mission.Vehicle;
            $scope.recalcDV();
            
            if(currentStages > newStages) {
                for (var i = $scope.form.Mission.Events.length - 1; i >= 0; i--) {
                    if($scope.form.Mission.Events[i].stage > newStages-1)
                        $scope.form.Mission.Events.splice(i, 1);
                }
            }
            $scope.$apply();
        }, null);
    };

    // this handles moving back to homepage
    if ($scope.$parent.selectedMission !== undefined) {
        $scope.selectMission($scope.$parent.selectedMission);
    }

    $scope.selectSite = function (site) {
        $scope.form.Mission.launchsite = site.code;
        if($scope.runTutorial && site.code === 'BOCA') {
            $scope.processTutorial(4);
        }
        
    };
    $scope.selectEvent = function (event) {
        $scope.selectedEvent = $scope.selectedEvent === event ? null : event;
    };
    $scope.getStageByNumber = function(numArray) {
        if(!$scope.form || numArray === undefined)
            return null;
        var arr = [];
        for(var k=0;k<numArray.length;k++) {
            var num = numArray[k];
            for (var i = 0; i < $scope.form.Mission.Vehicle.Stages.length; i++) {
                if ($scope.form.Mission.Vehicle.Stages[i].stageNumber === num) {
                    arr.push($scope.form.Mission.Vehicle.Stages[i]);
                    continue;
                }

                for (var j = 0; j < $scope.form.Mission.Vehicle.Stages[i].Boosters.length; j++) {
                    if ($scope.form.Mission.Vehicle.Stages[i].Boosters[j].stageNumber === num) {
                        arr.push($scope.form.Mission.Vehicle.Stages[i].Boosters[j]);
                        continue;
                    }
                }
            }
        }
        return arr.sort(function(a, b){return a.stageNumber-b.stageNumber;});
    };

    $scope.openStageEditDialog = function ($event, $stageIndex, stage) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lStage, $mdDialog) {

                $scope.parentScope = lParent;

                $scope.selectedStage = jQuery.extend(true, {}, lStage);
                $scope.tempEvents = jQuery.extend(true, [], lForm.Mission.Events);
                $scope.stageTypes = $scope.parentScope.stageTypes;
                $scope.engineTypes = $scope.parentScope.engineTypes;

                $scope.selectStageType = function (newStage) {
                    
                    newStage.Engines = $scope.selectedStage.Engines;
                    newStage.Boosters = $scope.selectedStage.Boosters;
                    $scope.selectedStage = jQuery.extend(true, {}, newStage);
                    $scope.selectedStage.stageName = newStage.name;
                    
                };
                $scope.removeEngine = function ($index) {
                    
                    $scope.selectedStage.Engines.splice($index, 1);
                    $scope.selectedStage.Engines.forEach(function (obj, i) {
                        obj.engineId = i;
                    });
                    $scope.tempEvents.forEach(function(event) {
                        
                        if(event.stage === $scope.selectedStage.stageNumber) {
                            for (var i = event.Engines.length - 1; i >= 0; i--) {
                                if(event.Engines[i].engineId === $index) {
                                    event.Engines.splice(event.Engines[i], 1);
                                } else if (event.Engines[i].engineId > $index) {
                                    event.Engines[i].engineId--;
                                }
                            }
                        }
                    });
                    $scope.parentScope.recalcDV();

                };
                $scope.incrementEngines = function ($event) {
                    $scope.selectedStage.Engines.push({
                        engineId: $scope.selectedStage.Engines.length
                    });
                    
                    $scope.openEngineEditDialog($event, $scope.selectedStage.Engines.length-1, $scope.selectedStage.Engines[$scope.selectedStage.Engines.length-1]);
                };

                $scope.openEngineEditDialog = function ($event, $engineIndex, engineConfig) {

                    var obj = {
                        controller: function ($scope, lEngineTypes, lEngineConfig, $mdDialog, lStage) {

                            $scope.selectedEngineConfig = jQuery.extend(true, {}, lEngineConfig);
                            $scope.engineTypes = lEngineTypes;
                            $scope.stage = lStage;

                            $scope.selectEngineType = function (newEngine) {
                                $scope.selectedEngineConfig.Engine = newEngine;
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                            $scope.finish = function () {
                                $mdDialog.hide();
                            };
                            $scope.save = function () {
                                $scope.stage.Engines[$engineIndex] = $scope.selectedEngineConfig;
                                $mdDialog.hide();
                            };
                        },
                        templateUrl: '/pages/editEngine.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: $event,
                        clickOutsideToClose: true,
                        //preserveScope: true,
                        autoWrap: true,
                        skipHide: true,
                        locals: {
                            lStage: $scope.selectedStage,
                            lEngineTypes: $scope.engineTypes,
                            lEngineConfig: engineConfig
                        }
                    };
                    $mdDialog.show(obj);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {                    
                    lForm.Mission.Vehicle.Stages[$stageIndex] = $scope.selectedStage;
                    lForm.Mission.Events = $scope.tempEvents;
                    resetstageNumbersAndEvents();
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editStage.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lStage: stage
            }
        });
        
        if($scope.runTutorial && $stageIndex===0)
            $scope.processTutorial(7);
    };

    $scope.openBoosterEditDialog = function ($event, stage, $boosterIndex, booster) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lStage, lBooster, $mdDialog) {

                $scope.parentScope = lParent;

                $scope.selectedStage = jQuery.extend(true, {}, lBooster);
                $scope.tempEvents = jQuery.extend(true, [], lForm.Mission.Events);
                $scope.stageTypes = $scope.parentScope.stageTypes;
                $scope.engineTypes = $scope.parentScope.engineTypes;

                $scope.selectStageType = function (newStage) {
                    
                    newStage.Engines = $scope.selectedStage.Engines;
                    newStage.Boosters = $scope.selectedStage.Boosters;
                    $scope.selectedStage = jQuery.extend(true, {}, newStage);
                    $scope.selectedStage.stageName = newStage.name;
                    
                };
                $scope.removeEngine = function ($index) {
                    
                    $scope.selectedStage.Engines.splice($index, 1);
                    $scope.selectedStage.Engines.forEach(function (obj, i) {
                        obj.engineId = i;
                    });
                    $scope.tempEvents.forEach(function(event) {
                        
                        if(event.stage === $scope.selectedStage.stageNumber) {
                            for (var i = event.Engines.length - 1; i >= 0; i--) {
                                if(event.Engines[i].engineId === $index) {
                                    event.Engines.splice(event.Engines[i], 1);
                                } else if (event.Engines[i].engineId > $index) {
                                    event.Engines[i].engineId--;
                                }
                            }
                        }
                    });
                    $scope.parentScope.recalcDV();

                };
                $scope.incrementEngines = function ($event) {
                    $scope.selectedStage.Engines.push({
                        engineId: $scope.selectedStage.Engines.length
                    });

                    $scope.openEngineEditDialog($event, $scope.selectedStage.Engines.length-1, $scope.selectedStage.Engines[$scope.selectedStage.Engines.length-1]);
                };

                $scope.openEngineEditDialog = function ($event, $engineIndex, engineConfig) {

                    var obj = {
                        controller: function ($scope, lEngineTypes, lEngineConfig, $mdDialog, lStage) {

                            $scope.selectedEngineConfig = jQuery.extend(true, {}, lEngineConfig);
                            $scope.engineTypes = lEngineTypes;
                            $scope.stage = lStage;

                            $scope.selectEngineType = function (newEngine) {
                                $scope.selectedEngineConfig.Engine = newEngine;
                            };
                            $scope.cancel = function () {
                                $mdDialog.cancel();
                            };
                            $scope.finish = function () {
                                $mdDialog.hide();
                            };
                            $scope.save = function () {
                                $scope.stage.Engines[$engineIndex] = $scope.selectedEngineConfig;
                                $mdDialog.hide();
                            };
                        },
                        templateUrl: '/pages/editEngine.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: $event,
                        clickOutsideToClose: true,
                        //preserveScope: true,
                        autoWrap: true,
                        skipHide: true,
                        locals: {
                            lStage: $scope.selectedStage,
                            lEngineTypes: $scope.engineTypes,
                            lEngineConfig: engineConfig
                        }
                    };
                    $mdDialog.show(obj);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lStage.Boosters[$boosterIndex] = $scope.selectedStage;
                    lForm.Mission.Events = $scope.tempEvents;
                    resetstageNumbersAndEvents();
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editStage.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lBooster: booster,
                lStage: stage
            }
        });
    };

    $scope.openEventEditDialog = function ($trigger, $eventIndex, event) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, lEvent, $mdDialog) {

                $scope.parentScope = lParent;
                $scope.selectedEvent = jQuery.extend(true, {}, lEvent);
                $scope.type = $scope.parentScope.type;
                $scope.stages = $scope.parentScope.form.Mission.Vehicle.Stages;
                $scope.stageEngines = $scope.parentScope.form.Mission.Vehicle.Stages[$scope.selectedEvent.stage].Engines;
                $scope.gravTurnSelect = $scope.parentScope.gravTurnSelect;
                
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lForm.Mission.Events[$eventIndex] = $scope.selectedEvent;
                    lParent.recalcDV();
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editEvent.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $trigger,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form,
                lEvent: event
            }
        });
    };

    $scope.openAdminEditDialog = function ($trigger) {

        $mdDialog.show({
            controller: function ($scope, lParent, lForm, $mdDialog) {

                $scope.parentScope = jQuery.extend(true, {}, lParent);
                $scope.companies = lParent.companies;
                
                // offset stuff necessary if client is not UTC. Date() returns time in local TZ >:|
                var today = new Date();
                var offset = -(today.getTimezoneOffset()/60);
                var tempDate = new Date($scope.parentScope.form.Mission.date);
                $scope.parentScope.form.Mission.date = new Date(tempDate.getTime() - offset*60*60*1000);
                
                Date.prototype.yyyymmdd = function () {
                    var mm = this.getMonth() + 1; // getMonth() is zero-based
                    var dd = this.getDate();

                    return [this.getFullYear(),
                        (mm > 9 ? '' : '0') + mm,
                        (dd > 9 ? '' : '0') + dd
                    ].join('-');
                };
                
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.finish = function () {
                    $mdDialog.hide();
                };
                $scope.save = function () {
                    lForm.Mission.code = $scope.parentScope.form.Mission.code;
                    lForm.Mission.description = $scope.parentScope.form.Mission.description;
                    lForm.Mission.date = $scope.parentScope.form.Mission.date.yyyymmdd();
                    lForm.Mission.time = $scope.parentScope.form.Mission.time;
                    lForm.Mission.company = $scope.parentScope.form.Mission.company;
                    lForm.Mission.orbits = $scope.parentScope.form.Mission.orbits;
                    lForm.Mission.display = $scope.parentScope.form.Mission.display;
                    $mdDialog.hide();
                };
            },
            templateUrl: '/pages/editAdmin.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: $trigger,
            clickOutsideToClose: true,
            locals: {
                lParent: $scope,
                lForm: $scope.form
            }
        });
    };
    
    var resetstageNumbersAndEvents = function() {
        
        //var stageNumberMap = []; // maps old stageNumber to new stageNumber for updating Events
        
        var i = 0;
        for(var index=0;index<$scope.form.Mission.Vehicle.Stages.length;index++) {
            
            var obj = $scope.form.Mission.Vehicle.Stages[index];
            //stageNumberMap[obj.stageNumber] = i;
            obj.stageNumber = i++;
            
            $scope.form.Mission.Vehicle.Stages[index].Boosters.forEach(function (obj) {
                //stageNumberMap[obj.stageNumber] = i;
                obj.stageNumber = i++;
            });
        }
        /*
         
         I've decided not to do this. The user should get a warning if there are
         unmatched events when they hit submit instead!

        // make list of events belonging to that entity to remove
        // decrement 'stage' property of all events for higher entities
        var list = [];
        $scope.form.Mission.Events.forEach(function(event, i) {
            if(stageNumberMap[event.stage] === undefined) 
                list.push(i);
            event.stage = stageNumberMap[event.stage];
        });
                
        for(var i=list.length-1;i>=0;i--) {
            $scope.form.Mission.Events.splice(list[i], 1);
        }
        */
    };
    
    $scope.removeEntity = function (parentStage, $index) {

        // remove entity by stageNumber
        if(parentStage) {
            parentStage.Boosters.splice($index, 1);
        } else {
            $scope.form.Mission.Vehicle.Stages.splice($index, 1);
        }

        resetstageNumbersAndEvents();
        $scope.recalcDV();
    };
    
    $scope.incrementEntity = function(parentStage) {
        if(parentStage) {
            parentStage.Boosters[parentStage.Boosters.length] = {
                Engines: [],
                Boosters: []
            };
        } else {
            $scope.form.Mission.Vehicle.Stages[$scope.form.Mission.Vehicle.Stages.length] = {
                Engines: [],
                Boosters: []
            };
        }        
        resetstageNumbersAndEvents();
    };
    
    $scope.recalcDV = function() {
        
        var totalDV = 0;
        var stages = $scope.form.Mission.Vehicle.Stages;
        
        for(var i=0;i<stages.length;i++) {
            
            if(stages[i].Engines[0] === undefined)
                continue;
            
            // Use Vac ISP of first engine by default
            var isp = stages[i].Engines[0].Engine.ispVac;
            
            if(i===0) {
                // for lower stages, take midpoint of SL and Vac ISP
                isp = 0.5*(stages[i].Engines[0].Engine.ispSL+stages[i].Engines[0].Engine.ispVac);
            } else if (stages[i].Engines.length>1) {
                // for upper stages, specifically look for Vac engines and use them
                for(var e=0;e<stages[i].Engines.length;e++) {
                    if(stages[i].Engines[e].Engine.ispSL === null) {
                        isp = stages[i].Engines[e].Engine.ispVac;
                        break;
                    }
                }
            }
            
            var aboveMass = 0;
            for(var j=i+1;j<stages.length;j++) {
                aboveMass += stages[j].dryMass + stages[j].propMass;
                for (var k = 0; k < stages[j].Boosters.length; k++) {
                    aboveMass += stages[j].Boosters[k].dryMass + stages[j].Boosters[k].propMass;
                }
                if (stages[j].fairingMass)
                    aboveMass += stages[j].fairingMass;
            }
            aboveMass += parseFloat($scope.form.Mission.Payload.mass);
            
            var m0 = aboveMass + stages[i].dryMass + stages[i].propMass;
            var m1 = aboveMass + stages[i].dryMass;
            for (var j = 0; j < stages[i].Boosters.length; j++) {
                m0 += stages[i].Boosters[j].dryMass + stages[i].Boosters[j].propMass;
                m1 += stages[i].Boosters[j].dryMass;
            }
            var mf = m0 / m1;
            
            totalDV += 9.81*isp*Math.log(mf);
        }
        $scope.payloadDV = (totalDV/1000.0).toPrecision(3);
    };
    
    $scope.addEvent = function () {
        var newEvent = {
            type: null,
            stage: null,
            name: null,
            time: null,
            dynamic: null,
            Attitude: {
                pitch: null,
                yaw: null,
                gt: null,
                throttle: null
            },
            Engines: []
        };
        $scope.form.Mission.Events.push(newEvent);
        $scope.sortEvents();
        $scope.selectedEvent = newEvent;
    };
    $scope.removeEvent = function (index) {
        if($scope.selectedEvent === $scope.form.Mission.Events[index])
            $scope.selectedEvent = null;
        $scope.form.Mission.Events.splice(index, 1);
    };

    $scope.sortEvents = function () {
        $scope.form.Mission.Events.sort(function (a, b) {
            if(a.time === null || a.time === undefined)
                return 1;
            if(b.time === null || b.time === undefined)
                return -1;
            return parseFloat(a.time) - parseFloat(b.time);
        });
    };
    
    $scope.export = function (ev) {       
        
        $scope.form.auth = {token: $scope.$parent.token};
        var formAsJSON_string = JSON.stringify($scope.form);
        $scope.form.auth = {token: null};
        var formHash = window.btoa(formAsJSON_string);
       
        
        $scope.exportStyle = true;
        if($scope.supports_html5_storage()) {
            window['localStorage']['fc_profile'] = formHash;
            $scope.exportStatusColor = '#82CA9D';
            $scope.export_icon = 'check';
            $timeout(function() {
                $scope.export_icon = 'content_copy';
                $scope.exportStyle = false;
            }, 4000);
        } else {
            $scope.exportStatusColor = '#F7977A';
            $scope.export_icon = 'close';
            $timeout(function() {
                $scope.export_icon = 'content_copy';
                $scope.exportStyle = false;
            }, 4000);
            $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Not supported!')
                    .textContent('Your browser doesn\'t support local storage! Upgrade, fool!')
                    .ariaLabel('export failure')
                    .ok(':(')
                    .targetEvent(ev)
                    );            
        }
    };
    
    $scope.import = function (ev) {
        
        $scope.importStyle = true;
        if($scope.supports_html5_storage()) {
            var formHash = window['localStorage']['fc_profile'];
            try {
                var formData = window.atob(formHash);
                $scope.form = JSON.parse(formData);
                setNewMission($scope.form.Mission.code);
                $scope.importStatusColor = '#82CA9D';
                $scope.import_icon = 'check';
                $timeout(function () {
                    $scope.import_icon = 'content_paste';
                    $scope.importStyle = false;
                }, 4000);
            } catch (err) {
                $scope.importStatusColor = '#F7977A';
                $scope.import_icon = 'close';
                $timeout(function () {
                    $scope.import_icon = 'content_paste';
                    $scope.importStyle = false;
                }, 4000);
                $mdDialog.show(
                        $mdDialog.alert()
                        .clickOutsideToClose(true)
                        .title('Import error!')
                        .htmlContent(err.stack.replace('\n', '<br>'))
                        .ariaLabel('import failure')
                        .ok('Ok!')
                        .targetEvent(ev)
                        );
            }
        } else {
            $scope.importStatusColor = '#F7977A';
            $scope.import_icon = 'close';
            $timeout(function () {
                $scope.import_icon = 'content_paste';
                $scope.importStyle = false;
            }, 4000);
            $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Not supported!')
                    .textContent('Your browser doesn\'t support local storage! Upgrade, fool!')
                    .ariaLabel('import failure')
                    .ok('Ok!')
                    .targetEvent(ev)
                    );
        }

    };
    
    var validateEventswithStages = function() {
        
        var returnObj = {
            isValid: true,
            invalidEvents: [],
            unusedStages: []
        };
        
        var stagesReferencedInEvents = [];
        var maxStageNumber = -1;
        $scope.form.Mission.Vehicle.Stages.forEach(function(stage) {
            maxStageNumber++;
            stage.Boosters.forEach(function() {maxStageNumber++;});
        });
        
        // check for events that reference non-existent stages
        $scope.form.Mission.Events.forEach(function(event) {
            if(event.stageNumbers === undefined)
                returnObj.invalidEvents.push(event);
            else {
                for(var i=0;i<event.stageNumbers.length;i++) {
                    stagesReferencedInEvents.push(event.stageNumbers[i]);
                    if(event.stageNumbers[i] > maxStageNumber)
                        returnObj.invalidEvents.push(event);
                }
            }
        });
        
        // check for stages that have no attached events
        $scope.form.Mission.Vehicle.Stages.forEach(function(stage) {
           if(stagesReferencedInEvents.indexOf(stage.stageNumber)===-1)
               returnObj.unusedStages.push(stage);
            stage.Boosters.forEach(function(booster) {
                if (stagesReferencedInEvents.indexOf(booster.stageNumber)===-1)
                    returnObj.unusedStages.push(booster);
            });
        });
        
        returnObj.isValid = returnObj.invalidEvents.length===0 && returnObj.unusedStages.length===0;
        return returnObj;
    };

    $scope.submit = function () {
        
        var validation = validateEventswithStages();
        if(!validation.isValid) {
            
            var stageList = '<ul>';
            validation.unusedStages.forEach(function(stage) {
                stageList += '<li>'+stage.stageName + '</li>';
            });
            stageList += '</ul>';
            
            var eventList = '<ul>';
            validation.invalidEvents.forEach(function(event) {
                eventList += '<li>'+event.name + '</li>';
            });
            eventList += '</ul>';
            
            var confirm = $mdDialog.confirm()
                    .title("Warning! Possible invalid profile")
                    .htmlContent(
                        (validation.unusedStages.length===0?'':('There were no events assigned to the following stages:'+stageList))
                        +(validation.invalidEvents.length===0?'':('The following events don\'t reference a valid stage:'+eventList))
                        +'Do you want to continue? Simulation may fail.'
                    )
                    .ariaLabel('Update Confirmation')
                    .targetEvent(event)
                    .ok('Ok')
                    .cancel('Go back');
            $mdDialog.show(confirm).then(function () {
                processSubmit();
            }, null);
        } else {
            processSubmit();
        }
    };
    
    var processSubmit = function() {
        
        $scope.form.auth = {token: $scope.$parent.token};
        var formHash = $scope.updateUrl();
        $scope.form.auth = {token: null};
        
        var simCount = parseInt($cookies.get($scope.$parent.cookies.SIMCOUNT));
        $cookies.put($scope.$parent.cookies.SIMCOUNT, simCount ? simCount+1 : 1);
        
        window.open($scope.$parent.client + '/results/#' + formHash, '_blank');
    };

    $scope.save = function (event)
    {
        $scope.httpRequest('/missions/' + $scope.form.Mission.code, 'GET', null,
                function (data) {
                    var exists = false;
                    if (data.error === undefined)
                        exists = true;
                    $scope.form.auth = {token: $scope.$parent.token};
                    var formAsJSON_string = JSON.stringify($scope.form);
                    if (exists)
                    {
                        var confirm = $mdDialog.confirm()
                                .title("Update " + $scope.form.Mission.code)
                                .textContent('This will update ' + $scope.form.Mission.description)
                                .ariaLabel('Update Confirmation')
                                .targetEvent(event)
                                .ok('Ok')
                                .cancel('Cancel');
                        $mdDialog.show(confirm).then(function () {
                            $scope.saving = true;
                            $scope.httpRequest('/missions/' + $scope.form.Mission.code, 'PUT', formAsJSON_string, saveSuccess, saveError);
                        }, null);
                    } else
                    {
                        var confirm = $mdDialog.confirm()
                                .title($scope.form.Mission.code + " doesn't exist yet")
                                .textContent("This will create a new mission called '" + $scope.form.Mission.description + "'")
                                .ariaLabel('Create Confirmation')
                                .targetEvent(event)
                                .ok('Ok')
                                .cancel('Cancel');
                        $mdDialog.show(confirm).then(function () {
                            $scope.saving = true;
                            $scope.httpRequest('/missions/', 'POST', formAsJSON_string, saveSuccess, saveError);
                        }, null);
                    }
                }, null);

    };

    var saveSuccess = function () {
        $scope.saving = false;
        $scope.saveStatusColor = '#82CA9D';
        $scope.save_icon = 'check';
        $scope.saveStyle = true;
        $scope.$apply();
        $timeout(function () {
            $scope.save_icon = 'save';
            $scope.saveStyle = false;
        }, 4000);
    };

    var saveError = function () {
        $scope.saving = false;
        $scope.saveStatusColor = '#F7977A';
        $scope.save_icon = 'close';
        $scope.saveStyle = true;
        $scope.$apply();
        $timeout(function () {
            $scope.save_icon = 'save';
            $scope.saveStyle = false;
        }, 4000);
    };

});
angular.module('FlightClub').controller('ContactCtrl', function ($scope, $http, $mdDialog) {
    
    $scope.$emit('viewBroadcast', 'contact');
    
    $scope.$parent.toolbarTitle = 'Flight Club | Contact';
    $scope.mailSuccess = false;
    $scope.form = {
        name: '',
        email: '',
        message: ''
    };

    $scope.formDisabled = true;
    $scope.validate = function () {
        $scope.mailSuccess = false;
        if ($scope.form.email === ''
                || $scope.form.name === ''
                || $scope.form.message === '')
            $scope.formDisabled = true;
        else
            $scope.formDisabled = false;
    };

    $scope.sendMail = function () {
        $scope.formDisabled = true;
        $http({url: '/process.php', data: $.param($scope.form), method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(function () {
            $scope.mailSuccess = true;
        }, function () {
            $mdDialog.show(
                    $mdDialog.alert()
                    .parent(angular.element(document.querySelector('#mailForm')))
                    .clickOutsideToClose(true)
                    .title('Something\'s broken')
                    .textContent('You can mail me directly at murphd37@tcd.ie. Sorry about that.')
                    .ariaLabel('Mail failed')
                    .ok('Got it!')
                    );
        });
    };
});
/* global StripeCheckout */

angular.module('FlightClub').controller('DonateCtrl', function ($scope) {

    $scope.$emit('viewBroadcast', 'donate');

    $scope.$parent.toolbarTitle = 'Flight Club | Donate';
    $scope.processed = false;
    $scope.success = false;
    $scope.isLoading = false;

    $scope.click = function () {
        // Open Checkout with further options
        $scope.valid = false;
        $scope.handler.open({
            name: 'flightclub.io',
            description: 'Donation',
            currency: "eur",
            amount: 100 * parseFloat($scope.amountEuro)
        });
    };

    $scope.valid = false;
    $scope.validate = function () {
        var input = parseFloat($scope.amountEuro);

        if ($scope.processed) {
            $scope.error = "You've already donated successfully!";
            $scope.valid = false;
        } else if (isNaN(input)) {
            $scope.error = $scope.amountEuro === "" ? "" : $scope.amountEuro + " is not a valid amount";
            $scope.valid = false;
        } else if (input < 1) {
            $scope.error = "Amount must be at least €1!";
            $scope.valid = false;
        } else {
            $scope.error = "";
            $scope.valid = true;
        }
    };

    angular.element(document).ready(function () {
        $.getScript("//checkout.stripe.com/checkout.js", function ()
        {
            $scope.handler = StripeCheckout.configure({
                key: 'pk_live_s4EXO3kyuZktYh40Mbed0IFi',
                image: 'images/favicon/android-icon-192x192.png',
                locale: 'auto',
                token: function (token) {
                    $scope.isLoading = true;
                    $scope.$apply();
                    var data = {
                        amount: 100 * parseFloat($scope.amountEuro),
                        stripeToken: token.id,
                        email: token.email,
                        client_ip: token.client_ip
                    };
                    $scope.processed = true;
                    $scope.$parent.httpRequest('/donate', 'POST', JSON.stringify(data),
                            function (res) {
                                $scope.isLoading = false;
                                if (res.error === undefined) {
                                    $scope.success = true;
                                } else {
                                    $scope.error = "Oops! There was an error of some sort. Your card has not been charged.";
                                    $scope.errorDetail = res.error;
                                }
                                $scope.$apply();
                            },
                            function (res) {
                                $scope.isLoading = false;
                                $scope.error = "Oops! Looks like FlightClub isn't responding. You will not be charged.";
                                $scope.errorDetail = res.error;
                                $scope.$apply();
                            }
                    );
                }
            });
        });
    });

});
angular.module('FlightClub').controller('ErrorCtrl', function ($http, $scope) {

    $scope.$emit('viewBroadcast', 'error');

    $scope.$parent.toolbarTitle = 'Flight Club | Error';
    $scope.mailSuccess = $scope.mailError = $scope.formDisabled = false;

    var hash = window.location.hash.substring(1);
    $scope.data = JSON.parse(window.atob(hash));

    $scope.reportError = function () {

        $scope.formDisabled = true;
        $http({url: '/report.php', data: $.param($scope.data), method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
        }).then(function () {
            $scope.mailSuccess = true;
        }, function () {
            $scope.mailError = true;
        });
    };

});
angular.module('FlightClub').controller('HomeCtrl', function ($scope) {

    $scope.$parent.toolbarClass = "hide";
    $scope.$emit('viewBroadcast', 'home');

});
angular.module('FlightClub').controller('MediaCtrl', function ($scope) {

    $scope.$emit('viewBroadcast', 'media');

    $scope.$parent.toolbarTitle = 'Flight Club | Media';
    
    $scope.mediaTiles = (function() {
    var tiles = [];
        tiles.push(
            {name: 'TMRO Interview', url: '//www.tmro.tv/2016/10/16/beautiful-data-rocket-launches/', thumbnail: '//cdn.tmro.tv/wp-content/uploads/2014/09/21232643/Web.png' },
            {name: 'The Economist', url: '//www.economist.com/technology-quarterly/2016-25-08/space-2016', thumbnail: '//hostr.co/file/mobi6hWDSlFo/small_The_Economist_logo.jpg' },
            {name: 'Twitter Mentions', url: '//twitter.com/search?vertical=default&q=flightclub.io%20OR%20%23flightclubio&src=typd', thumbnail: '//abs.twimg.com/icons/apple-touch-icon-192x192.png' },
            {name: 'SpaceX CRS-9', url: '//www.youtube.com/watch?v=NT50R2dLht8', thumbnail: '//img.youtube.com/vi/NT50R2dLht8/mqdefault.jpg' },
            {name: 'Cesium Showcase', url: '//cesiumjs.org/demos/FlightClub.html', thumbnail: '//cesiumjs.org/images/favicon.ico' },
            {name: 'SpaceX CRS-8', url: '//www.youtube.com/watch?v=ibv6vcNrxzA', thumbnail: '//img.youtube.com/vi/ibv6vcNrxzA/mqdefault.jpg' },
            {name: 'SpaceX JCSAT-14', url: '//www.youtube.com/watch?v=ui2H8aV99I4', thumbnail: '//img.youtube.com/vi/ui2H8aV99I4/mqdefault.jpg' },
            {name: 'Orbital Mechanics Interview', url: '//theorbitalmechanics.com/show-notes/psas', thumbnail: '//theorbitalmechanics.com/favicon.ico' },
            {name: 'SpaceX SES-9', url: '//www.youtube.com/watch?v=wkMZbL-CzB0', thumbnail: '//img.youtube.com/vi/wkMZbL-CzB0/mqdefault.jpg' },
            {name: 'SpaceX Jason-3', url: '//www.youtube.com/watch?v=bpVNV9FzHqI', thumbnail: '//img.youtube.com/vi/bpVNV9FzHqI/mqdefault.jpg' },
            {name: 'SpaceX Orbcomm OG2', url: '//www.youtube.com/watch?v=RKJBV5vcel8', thumbnail: '//img.youtube.com/vi/RKJBV5vcel8/mqdefault.jpg' },
            {name: 'Popular Mechanics Article', url: '//www.popularmechanics.com/space/rockets/a18289/choose-your-own-spacex-adventure-with-this-website/', thumbnail: 'https://nikolamotor.com/uploads/article/press_image/13/popularmechanics_logo.png' }
        );
        return tiles;
    })();

});
/* global Plotly */

angular.module('FlightClub').controller('ResultsCtrl', function ($scope, $mdDialog, $cookies, $interval) {

    $scope.$emit('viewBroadcast', 'results');

    $scope.$parent.toolbarTitle = 'Flight Club | Results';
    $scope.loadPos = 30;
    $scope.loadMessage = "Building plots...";    

    $scope.messageArray = [
        // p is probability of update being skipped until next interval
        { p: 0.2, message: 'Engine Chill'},
        { p: 0.2, message: 'Terminal Count'},
        { p: 0.2, message: 'Main Engine Start'},
        { p: 0.5, message: 'Liftoff!'},
        { p: 0.3, message: 'Vehicle is supersonic'},
        { p: 0.3, message: 'Vehicle is passing through Max Q'},
        { p: 0.6, message: 'MECO!'},
        { p: 0.3, message: 'Stage separation. Good luck Stage 1...'},
        { p: 0.5, message: 'Upper stage ignition'},
        { p: 0.5, message: 'Boostback looks good'},
        { p: 0.4, message: 'Entry burn is complete'},
        { p: 0.3, message: 'Landing burn has begun'},
        { p: 0.6, message: 'LZ-1, The Falcon has landed'},
        { p: 0.5, message: 'We have SECO!'},
        { p: 0.9, message: '<a href="https://www.patreon.com/flightclub">Click here to support me on Patreon!</a>'},
        { p: 0.0, message: 'Follow me on Twitter: <a href="https://www.twitter.com/decmurphy_">@decmurphy_</a>'}        
    ];
    
    var i = 0;
    $scope.missionLoadingMessage = $scope.messageArray[i++].message;
    var roller = $interval(function() {
        if (i === $scope.messageArray.length || !$scope.isLoading)
            $interval.cancel(roller);
        else if (Math.random() > $scope.messageArray[i-1].p)
            $scope.loadMessageSecondary = $scope.messageArray[i++].message;
    }, 350);
    
    $scope.animate_rocket = function () {

        var windowWidth = $(document).width();
        var margin = 0.01 * $scope.loadPos * windowWidth + 'px';
        if ($scope.loadPos < 99.5) {
            $scope.loadPos += 0.5 * (100 - $scope.loadPos);
            $("#rocket").animate(
                    {marginLeft: margin},
                    1500,
                    "linear",
                    $scope.animate_rocket
                    );
        } else {
            $scope.loadPos = 30;
        }

    };

    $scope.load = function (queryString) {

        if (queryString.indexOf('&amp;') !== -1) {
            window.location = window.location.href.split('&amp;').join('&');
        }
        $scope.queryString = queryString;
        $scope.queryParams = $scope.$parent.parseQueryString(queryString);
        $scope.$parent.httpRequest('/simulator/results?' + queryString, 'GET', null,
                function (data) {
                    
                    var fileMap = new Object();
                    var files = data.Mission.Output.Files;
                    $.each(files, function (key, val)
                    {
                        fileMap[val.desc] = $scope.$parent.client + val.url;
                    });

                    var warningsFile = fileMap['warnings'];
                    $.get(warningsFile, function (txt) {
                        var warnings = txt.split(";");

                        $scope.warnings = [];
                        for (var i = 0; i < warnings.length; i++) {
                            if (warnings[i].length > 0)
                                $scope.warnings.push(warnings[i]);
                        }

                    });

                    var telemetryFile = fileMap['telemetry'];
                    $.get(telemetryFile, function (txt) {

                        var lines = txt.split("\n");
                        $scope.landing = [];
                        for (var i = 0; i < lines.length; i++)
                        {
                            // time-event map
                            if (i === 0) {
                                $scope.events = [];
                                var event = lines[i].split(';');
                                for (var j = 0; j < event.length; j++) {
                                    var pair = event[j].split(':');
                                    if (pair[0] !== undefined && pair[1] !== undefined) {
                                        $scope.events.push({when: pair[0], what: pair[1]});
                                    }
                                }
                            } else {
                                var map = lines[i].split(':');
                                var infoMap = map[1].split(';');

                                switch (map[0]) {
                                    case 'Landing':
                                        for (var j = 0; j < infoMap.length; j++) {
                                            var pair = infoMap[j].split('=');
                                            if (pair[0] !== undefined && pair[1] !== undefined) {
                                                $scope.landing.push({when: pair[0], what: pair[1]});
                                            }
                                        }
                                        break;
                                    case 'Orbit':
                                        $scope.orbit = [];
                                        for (var j = 0; j < infoMap.length; j++) {
                                            var pair = infoMap[j].split('=');
                                            if (pair[0] !== undefined && pair[1] !== undefined) {
                                                $scope.orbit.push({when: pair[0], what: pair[1]});
                                            }
                                        }
                                        break;
                                }
                            }
                        }
                    });
                }
        );
        $scope.$parent.httpRequest('/missions/' + $scope.queryParams['code'], 'GET', null,
                function (res) {
                    var data = JSON.parse(res);
                    if (data.Mission !== undefined) {
                        if ($scope.queryParams['id'] === undefined) {
                            $scope.queryParams['id'] = data.Mission.livelaunch;
                        }
                    }
                    $scope.missionName = data.Mission.description;
                    $scope.getDataFile(0);

                }
        );
    };

    $scope.animate_rocket();
    var formHash = window.location.hash.substring(1);
    var queryString = window.location.search.substring(1);

    if (formHash) {
        $scope.loadMessage = "Calculating trajectory...";    
        var formData = window.atob(formHash);

        $scope.$parent.httpRequest('/simulator/new', 'POST', formData,
                function (data) {
                    if (data.Mission.success === true) {
                        var queryString = data.Mission.output.split('?')[1];
                        $scope.failureMode = data.Mission.failureMode;
                        $scope.loadMessage = "Building plots...";
                        window.history.pushState({}, "", '/results/?' + queryString);
                        $scope.load(queryString);
                        $scope.$apply();
                    } else {
                        var errorsHash = window.btoa(JSON.stringify(data));
                        window.location = $scope.$parent.client + '/error/#' + errorsHash;
                    }
                },
                function (data) {
                    var errors, errorsHash = '';
                    if (data.responseJSON !== undefined) {
                        errors = data.responseJSON.Mission.errors;
                        errorsHash = window.btoa(errors);
                    }

                    window.location = $scope.$parent.client + '/error/#' + errorsHash;
                });    
    } else if (queryString) {
        $scope.load(queryString);
    }

    var PLOTS = ['altitude1', 'profile1', 'inclination', 
        'velocity1', 'prop', 'phase1',
         'throttle', 'accel1', 'q',
        'aoa', 'aov', 'aop', 
        'total-dv', 'drag', 'thrust-coeff'];
    $scope.plotTiles = (function () {
        var tiles = [];
        for (var i = 0; i < PLOTS.length; i++) {
            tiles.push({title: PLOTS[i]});
        }
        return tiles;
    })();

    $scope.isLoading = true;
    $scope.fullData = [];
    $scope.eventsData = [];
    $scope.stageMap = [];
    $scope.numCols = 23;
    $scope.overrideAttempted = false;

    //////////////////////////////////////

    $scope.goToWorld = function () {
        window.location = "/world?view=earth&" + window.location.search.substring(1);
    };

    $scope.goToLive = function () {
        $scope.$parent.redirect("/world?w=1&code=" + $scope.queryParams['code']);
    };

    $scope.overrideLive = function () {
        if ($cookies.get($scope.$parent.cookies.AUTHTOKEN) === undefined)
            return;

        var queryString = window.location.search.substring(1);
        queryString += '&auth=' + $cookies.get($scope.$parent.cookies.AUTHTOKEN);
        $scope.$parent.httpRequest('/live/init?' + queryString, 'GET', null,
                function (data) {
                    $scope.overrideStatus = data.Success ? "check" : "close";
                    $scope.overrideAttempted = true;
                    $scope.$apply();
                },
                function (data) {
                    $scope.overrideStatus = "close";
                    $scope.overrideAttempted = true;
                    $scope.$apply();
                });
    };

    $scope.getDataFile = function (stage) {
        var url = $scope.$parent.client + '/output/' + $scope.queryParams['id'] + '_' + stage + '.dat';
        $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
            xhrFields: {withCredentials: false},
            success: successfn,
            error: errorfn
        });

        function successfn(data) {
            
            if(data.indexOf("html") !== -1) {
                $scope.initialisePlots();
            } else {
                var lines = data.split("\n");
                $scope.stageMap.push({id: stage, name: lines[0].split("#")[1]});

                $scope.fullData[stage] = [];
                for (var j = 0; j <= $scope.numCols; j++) {
                    $scope.fullData[stage][j] = [];
                    for (var i = 2; i < lines.length; i++) {
                        var data = lines[i].split(";");
                        if(data.length === 1)
                            data = lines[i].split("\t");
                        $scope.fullData[stage][j][i] = parseFloat(data[j]);
                    }
                }
                $scope.getEventsFile(stage);
            }
        }

        function errorfn(data) {
            void 0;
        }
    };

    $scope.getEventsFile = function (stage) {
        var url = $scope.$parent.client + '/output/' + $scope.queryParams['id'] + '_' + stage + '_events.dat';
        $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
            xhrFields: {withCredentials: false},
            success: successfn,
            error: errorfn
        });

        function successfn(data) {
            var lines = data.split("\n");

            $scope.eventsData[stage] = [];
            for (var j = 0; j <= $scope.numCols; j++) {
                $scope.eventsData[stage][j] = [];
                for (var i = 1; i < lines.length; i++) {
                    var data = lines[i].split(";");
                    if(data.length === 1)
                        data = lines[i].split("\t");
                    $scope.eventsData[stage][j][i] = parseFloat(data[j]);
                }
            }
            $scope.getDataFile(stage + 1);
        }

        function errorfn(data) {
            void 0;
        }
    };

    $scope.plotMap = [];
    $scope.initialisePlots = function () {
        
        var allStages = [], lowerStages = [];
        $scope.stageMap.forEach(function(el, i) {
            allStages.push(i);
            if(i !== $scope.stageMap.length-1)
                lowerStages.push(i);
        });

        $scope.plotMap.push({id: 'altitude1', stages: allStages, title: "Altitude", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear"},
            y: {axis: 4, label: "Altitude (km)", type: "linear"}});
        $scope.plotMap.push({id: 'profile1', stages: allStages, title: "Profile", events: true,
            x: {axis: 6, label: "Downrange (km)", type: "linear"},
            y: {axis: 4, label: "Altitude (km)", type: "linear"}});
        $scope.plotMap.push({id: 'velocity1', stages: allStages, title: "Velocity", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear"},
            y: {axis: 5, label: "Velocity (m/s)", type: "linear"}});
        $scope.plotMap.push({id: 'prop', stages: allStages, title: "Propellant Mass", events: false,
            x: {axis: 0, label: "Time (s)", type: "log"},
            y: {axis: 8, label: "Mass (t)", type: "log"}});
        $scope.plotMap.push({id: 'phase1', stages: lowerStages, title: "Booster Phasespace", events: true,
            x: {axis: 4, label: "Altitude (km)", type: "linear"},
            y: {axis: 5, label: "Velocity (m/s)", type: "linear"}});
        $scope.plotMap.push({id: 'total-dv', stages: allStages, title: "Total dV Expended", events: false,
            x: {axis: 0, label: "Time (s)", type: "log"},
            y: {axis: 9, label: "dV (m/s)", type: "log"}});
        $scope.plotMap.push({id: 'q', stages: lowerStages, title: "Aerodynamic Pressure", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear"},
            y: {axis: 7, label: "Pressure (kN/m^2)", type: "linear"}});
        $scope.plotMap.push({id: 'throttle', stages: allStages, title: "Throttle", events: false,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 12, label: "Throttle", type: "linear"}});
        $scope.plotMap.push({id: 'accel1', stages: allStages, title: "Acceleration", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 13, label: "Acceleration (g)", type: "linear"}});
        $scope.plotMap.push({id: 'aoa', stages: allStages, title: "Angle of Attack", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 14, label: "Angle (degrees)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'aov', stages: allStages, title: "Velocity Angle", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 15, label: "Angle (degrees)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'aop', stages: allStages, title: "Pitch Angle", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 16, label: "Angle (degrees)", type: "linear", range: [-180, 180]}});
        $scope.plotMap.push({id: 'drag', stages: lowerStages, title: "Drag Coefficient", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 17, label: "Cd", type: "linear"}});
        $scope.plotMap.push({id: 'thrust-coeff', stages: lowerStages, title: "Thrust Coefficient", events: true,
            x: {axis: 0, label: "Time (s)", type: "linear", range: [0, 1000]},
            y: {axis: 22, label: "Ct", type: "linear"}});
        $scope.plotMap.push({id: 'inclination', stages: allStages, title: "Inclination", events: false,
            x: {axis: 0, label: "Time (s)", type: "linear"},
            y: {axis: 23, label: "Incl (degrees)", type: "linear", range: [-180, 180]}});

        $scope.isLoading = false;        
        $scope.$apply(); // removing this fucks up the plot sizes in initialiePlot2()
        
        for (var i = 0; i < $scope.plotMap.length; i++) {
            $scope.initialisePlot2($scope.plotMap[i]);
        }
        
        if(!$scope.failureMode)
            setTimeout(askForSupport, 1000);
        else {
            $mdDialog.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('Mission Failure!')
                    .textContent($scope.failureMode)
                    .ariaLabel('mission failure reason')
                    .ok('Ok')
                );
        }
        
    };

    $scope.initialisePlot2 = function (plot) {

        var data = [];
        for (var i = 0; i < plot.stages.length; i++) {
            var s = plot.stages[i];
            if ($scope.fullData[s] !== undefined) {
                data.push({
                    x: $scope.fullData[s][plot.x.axis],
                    y: $scope.fullData[s][plot.y.axis],
                    mode: 'lines',
                    name: $scope.stageMap[s].name
                });
            }
        }
        if(plot.events) {
            for (var i = 0; i < plot.stages.length; i++) {
                var s = plot.stages[i];
                if ($scope.fullData[s] !== undefined) {
                    data.push({
                        x: $scope.eventsData[s][plot.x.axis],
                        y: $scope.eventsData[s][plot.y.axis],
                        mode: 'markers',
                        showlegend: false,
                        name: $scope.stageMap[s].name + ' Event'
                    });
                }
            }
        }

        var fontColor = $scope.$parent.theme==='fc_dark' ? '#fafafa' : '#181c1f';
        var bgColor = $scope.$parent.theme==='fc_dark' ? '#303030' : '#fafafa';
        var layout = {
            title: plot.title,
            showlegend: false,
            font: {
                family: 'Brandon Grotesque',
                size: 15,
                color: fontColor
            },
            xaxis: {
                color: fontColor,
                type: plot.x.type, 
                title: plot.x.label, 
                range: plot.x.range
            },
            yaxis: {
                color: fontColor,
                type: plot.y.type, 
                title: plot.y.label,
                range: plot.y.range
            },
            paper_bgcolor: bgColor,
            plot_bgcolor: bgColor
        };
        
        Plotly.newPlot(plot.id, data, layout);

    };
    
    $scope.$parent.$watch('theme', function() {
        
        if($scope.plotMap) {
            for (var i = 0; i < $scope.plotMap.length; i++) {
                $scope.initialisePlot2($scope.plotMap[i]);
            }
        }
        
    });
    
    var askForSupport = function() {
         
        if ($scope.supports_html5_storage()) {
            var donateRequest = window['localStorage']['fc_donateRequest'];
            if (donateRequest === undefined && $cookies.get($scope.$parent.cookies.SIMCOUNT) >= 3) {
                
                var confirm = $mdDialog.confirm()
                        .title('Support me on Patreon!')
                        .textContent('Hi, I\'m really sorry and I hate myself for annoying you with popups, but if you like Flight Club, I\'d really appreciate it if you considered supporting me on Patreon! I promise you\'ll never see this message again either way :)')
                        .ariaLabel('support request')
                        .ok('I love this site!')
                        .cancel('This site sucks');

                $mdDialog.show(confirm).then(
                        function () {
                            window['localStorage']['fc_donateRequest'] = 1;
                            window.open('https://www.patreon.com/flightclub', '_blank');
                        },
                        function () {
                            window['localStorage']['fc_donateRequest'] = 1;
                        }
                );
            }
        }
    };
    
});
/* global Cesium */

angular.module('FlightClub').controller('WorldCtrl', function ($scope, $mdDialog, $location, $interval) {
    
    $scope.$emit('viewBroadcast', 'world');

    $scope.worldLoading = true;
    $scope.messageArray = [
        // p is probability of update being skipped until next interval
        { p: 0.8, message: 'Getting data from /r/SpaceX...'},
        { p: 0.4, message: 'Killing Church...'},
        { p: 0.3, message: 'YVAN EHT NIOJ'},
        { p: 0.8, message: 'Literally downloading the entire planet.'},
        { p: 0.2, message: 'Have some patience, dammit'},
        { p: 0.8, message: 'Downloading trajectory data files...'},
        { p: 0.2, message: 'Damn your internet is slow, man'},
        { p: 0.2, message: 'I hope your browser can handle this'},
        { p: 0.9, message: '<a href="https://www.patreon.com/flightclub">Click here to support me on Patreon!</a>'},
        { p: 0.0, message: 'Follow me on Twitter: <a href="https://www.twitter.com/decmurphy_">@decmurphy_</a>'}
    ];
        
    var startRoller = function () {
        var i = 0;
        $scope.missionLoadingMessage = $scope.messageArray[i++].message;
        var roller = $interval(function () {
            if (i === $scope.messageArray.length || !$scope.worldLoading)
                $interval.cancel(roller);
            else if (Math.random() > $scope.messageArray[i - 1].p)
                $scope.missionLoadingMessage = $scope.messageArray[i++].message;
        }, 350);
    };
    startRoller();

    $scope.$parent.toolbarTitle = "Flight Club | Live";
    var w;

    var stageColours = [];
    var fullData = []; // all data from output files - filled at start
    var eventsData = []; // all data from events files - filled at start
    var vel = []; // vel vs. time - grows in real time
    var alt = []; // alt v. time - grows in real time
    var future = []; // full alt and vel data
    var focusPoints = []; // timestamps for specific points of interest. everything is plotted at these times

    var plot = {};
    var max = [];

    var offset;
    var rand5 = 1 * 60 * 1000 * Math.random(); // 1 minute range

    $scope.countdown = $scope.finished = false;
    $scope.cesiumShow = $scope.sidebarShow = false;

    $scope.clickStage = function (stage) {
        w.trackEntity(stage);
        plot["altitude"].getOptions().yaxes[0].max = max[stage]["altitude"];
        plot["altitude"].setupGrid();
        plot["velocity"].getOptions().yaxes[0].max = max[stage]["velocity"];
        plot["velocity"].setupGrid();
    };

    $scope.changeView = function () {

        switch (w.getProp('view')) {
            case 'space':
                w.setProp('view', 'earth');
                $location.search('view', 'earth');
                offset = 0;
                break;
            case 'earth':
            default:
                w.setProp('view', 'space');
                $location.search('view', 'space');
                offset = 17;
                break;
        }
        w.viewer.entities.removeAll();
        $scope.loadDataAndPlot();

    };

    $scope.setClock = function (world) {

        var _second = 1000;
        var _minute = _second * 60;
        var _hour = _minute * 60;
        var _day = _hour * 24;

        if ($scope.cesiumShow && world !== undefined) {
            if (world.viewer !== undefined) {
                var now = Cesium.JulianDate.toDate(world.viewer.clock.currentTime);
                var distance = $scope.launchTime - now;
                var sign = distance > 0 ? '-' : '+';
                var days = Math.floor(distance / _day);
                var hours = Math.abs(Math.floor((distance % _day) / _hour));
                var minutes = Math.abs(Math.floor((distance % _hour) / _minute));
                var seconds = Math.abs(Math.floor((distance % _minute) / _second));

                if (sign === '+') {
                    hours -= 1;
                    minutes -= 1;
                    seconds -= 1;
                }
                if (hours < 10)
                    hours = '0' + hours;
                if (minutes < 10)
                    minutes = '0' + minutes;
                if (seconds < 10)
                    seconds = '0' + seconds;

                if (world.getProp('w') !== '2') {
                    if (Math.abs((_minute - rand5) - distance) < 1000)  // polls for aborts between T-5 -> T-0
                        $scope.pollLaunchTime();
                    if (Math.abs(rand5 + distance) < 1000) // poll for aborts between T-0 -> T+5
                        $scope.pollLaunchTime();
                    if (Math.abs((90 * _minute) + distance) < 1000) // plots -> over at T+1:30
                        loadVars(true);
                }

                $scope.clock = 'T' + sign + hours + ':' + minutes + ':' + seconds;
            }

        } else if ($scope.countdown) {

            var now = new Date();
            var distance = $scope.launchTime - now;
            var sign = distance > 0 ? '-' : '+';
            var days = Math.floor(distance / _day);
            var hours = Math.abs(Math.floor((distance % _day) / _hour));
            var minutes = Math.abs(Math.floor((distance % _hour) / _minute));
            var seconds = Math.abs(Math.floor((distance % _minute) / _second));

            $scope.days = days + ' day' + ((days !== 1) ? 's' : '');
            $scope.hours = hours + ' hour' + ((hours !== 1) ? 's' : '');
            $scope.minutes = minutes + ' minute' + ((minutes !== 1) ? 's' : '');
            $scope.seconds = seconds + ' second' + ((seconds !== 1) ? 's' : '');

            //if (Math.abs((59 * _minute - rand5) - distance) < 1000) // clock -> plots limit between T-59 -> T-54
            if (Math.abs((60 * _minute) - distance) < 1000) // clock -> plots limit at T-60
                loadVars(true);

        }
    };

    $scope.pollLaunchTime = function () {
        $scope.$parent.httpRequest('/missions/' + w.getProp('code'), 'GET', null,
                function (data) {

                    data = JSON.parse(data);

                    var tempDate = data.Mission.date.replace(/-/g, "/") + ' ' + data.Mission.time + ' UTC';
                    var newTime = Date.parse(tempDate);

                    if (newTime !== $scope.launchTime) {
                        // if scrubbed until tomorrow, full reset. else just reset clock
                        if (newTime - $scope.launchTime > 24 * 60 * 60 * 1000)
                            $scope.fillData(data);
                        else {
                            $scope.launchTime = newTime;
                            $scope.getHazardMap();
                        }
                    }
                },
                null);
    };

    angular.element(document).ready(function () {

        var queryString = window.location.search.substring(1);
        if (queryString.indexOf('&amp;') !== -1) {
            window.location = window.location.href.split('&amp;').join('&');
        }
        $scope.queryParams = $scope.$parent.parseQueryString(queryString);
        loadVars();

        // world object doesn't need to be created unless using Cesium. can put launchtime as its own variable
        // then can move these getScript+new world() calls later in the code to only execute if showing Cesium.

        switch ($scope.queryParams['view']) {
            case 'space':
                offset = 17;
                break;
            case 'earth':
            default:
                offset = 0;
                break;
        }

        $interval(function () {
            $scope.setClock(w);
        }, 500);
        
    });
    
    var loadVars = function(reload) {

        $scope.$parent.httpRequest('/missions/' + $scope.queryParams['code'], 'GET', null,
                function (res) {
                    var data = JSON.parse(res);
                    if (data.Mission !== undefined && $scope.queryParams['id'] === undefined) {
                        $scope.queryParams['id'] = data.Mission.livelaunch;
                    }
                    if (reload) {
                        $scope.worldLoading = true;
                        startRoller();
                    }
                    
                    $scope.fillData(data);
                }
        );
        
    };

    $scope.fillData = function (data) {

        $scope.missionName = data.Mission.description;
        $scope.missionCode = $scope.queryParams['code'];
        $scope.numStages = data.Mission.Vehicle.Stages.length;

        var tempDate = data.Mission.date.replace(/-/g, "/") + ' ' + data.Mission.time + ' UTC';
        $scope.launchTime = Date.parse(tempDate);

        var now = new Date();
        var timeUntilLaunch = $scope.launchTime - now;

        $scope.cesiumShow = $scope.countdown = $scope.finished = $scope.sidebarShow = false;
        if ($scope.queryParams['w'] === '2') {

            $scope.loadCesium(function () {
                $scope.loadDataAndPlot();
            });

        } else if ($scope.queryParams['w'] === '1') {
            
            if (timeUntilLaunch > 1 * 60 * 60 * 1000) {
                $scope.countdown = true;
                $scope.worldLoading = false;
            } else if (timeUntilLaunch < -14 * 60 * 1000) {
                $scope.finished = true;
                $scope.worldLoading = false;
            } else {
                $scope.loadCesium(function () {
                    
                    var animation = document.getElementsByClassName("cesium-viewer-animationContainer")[0];
                    animation.className += " hide";
                    var timeline = document.getElementsByClassName("cesium-viewer-timelineContainer")[0];
                    timeline.className += " hide";

                    w.setCameraLookingAt(data.Mission.launchsite);
                    $scope.loadDataAndPlot();
                });
            }
        } else if ($scope.queryParams['id'] !== undefined) {

            $scope.loadCesium(function () {

                var animation = document.getElementsByClassName("cesium-viewer-animationContainer")[0];
                animation.className += " hide";
                var timeline = document.getElementsByClassName("cesium-viewer-timelineContainer")[0];
                timeline.className += " hide";
                
                $scope.loadDataAndPlot();
                if ($scope.queryParams['view'] !== 'space')
                    w.setCameraLookingAt(data.Mission.launchsite);
            });

        } else {
            $scope.loadCesium();
        }
    };

    $scope.loadFlot = function (otherFunction) {
        $.getScript("js/flot.min.js", function () {
            
            var fullWidth = $(document.body)[0].clientWidth;
            var width = fullWidth <= 456 ? fullWidth - 56 : fullWidth >= 960 ? 400 : 320;

            $("#cesiumContainer").width((fullWidth - width) + 'px');

            for (var stage = 0; stage < 2; stage++) {
                $scope.initialisePlot("altitude", stage);
                $scope.initialisePlot("velocity", stage);
            }

            if (otherFunction)
                otherFunction();
        });
        $scope.sidebarShow = true;
    };

    $scope.initialisePlot = function (element, stage) {

        var fullWidth = $(document.body)[0].clientWidth;
        var width = fullWidth <= 456 ? fullWidth - 56 : fullWidth >= 960 ? 400 : 320;
        width -= 32; // to account for layout-padding

        var placeholder = $("#" + element + "Plot");
        placeholder.width(width);
        placeholder.height(width / 1.6);

        if (placeholder.length > 0) {
            plot[element] = $.plot(placeholder, [[], []], {
                series: {
                    shadowSize: 0	// Drawing is faster without shadows
                },
                yaxis: {
                    min: 0,
                    max: max[stage][element]
                },
                xaxis: {
                    min: -2,
                    max: 600
                }
            });
        }
    };

    $scope.loadCesium = function (otherFunction) {

        window.CESIUM_BASE_URL = '//cesiumjs.org/releases/1.28/Build/Cesium/';
        $.getScript("//cesiumjs.org/releases/1.28/Build/Cesium/Cesium.js", function ()
        {
            $scope.worldLoading = false;
            Cesium.BingMapsApi.defaultKey = 'Atr1lJvbFdMUnJ6fw4qGKDcZuEjzVRh-6WLmrRZDcCggpZIPH9sdEyUWGWXO1kPc';

            w = new world();
            w.plottedTime = -5;

            w.setProps($scope.queryParams);

            $scope.cesiumShow = true;
            $scope.$parent.toolbarClass = "hide";

            var launchDate = new Date($scope.launchTime);
            var end = new Date($scope.launchTime + 600e3);
            var now;
            if (w.getProp('w') === '1')
                now = new Date();
            else
                now = new Date($scope.launchTime - 30e3);

            w.entities = [];
            w.viewer = new Cesium.Viewer('cesiumContainer', {
                timeline: true,
                animation: true,
                fullscreenButton: false,
                homeButton: false,
                geocoder: false,
                baseLayerPicker: false,
                creditContainer: document.getElementById("creditContainer"),
                clock: new Cesium.Clock({
                    startTime: Cesium.JulianDate.fromDate(launchDate),
                    currentTime: Cesium.JulianDate.fromDate(now),
                    stopTime: Cesium.JulianDate.fromDate(end),
                    clockRange: Cesium.ClockRange.UNBOUNDED,
                    clockStep: Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER
                }),
                terrainProvider: new Cesium.CesiumTerrainProvider({
                    url: '//assets.agi.com/stk-terrain/world',
                    requestWaterMask: false,
                    requestVertexNormals: false
                })

            });

            /* add to revert to old (include sun) */
            w.viewer.scene.globe.enableLighting = true;
            /**/

            w.viewer.timeline.updateFromClock();
            w.viewer.timeline.zoomTo(w.viewer.clock.startTime, w.viewer.clock.stopTime);

            if (otherFunction)
                otherFunction();
        });
    };

    $scope.loadDataAndPlot = function () {

        $scope.stageMap = {};
        for (var i = 0; i < $scope.numStages; i++) {

            $scope.stageMap[i] = {id: i};
            fullData[i] = [];

            if (alt[i] === undefined)
                alt[i] = [];
            alt[i][0] = [];
            alt[i][1] = [];

            if (vel[i] === undefined)
                vel[i] = [];
            vel[i][0] = [];
            vel[i][1] = [];

            future[i] = {};

            max[i] = {};
        }

        stageColours[0] = '#ff0000';
        stageColours[1] = '#8B8BE5';
        stageColours[2] = '#00ff00';

        $scope.getHazardMap();
    };

    $scope.getHazardMap = function () {

        w.entities = [];
        w.viewer.entities.removeAll();

        var url = $scope.$parent.server + '/resource/' + $scope.queryParams['code'] + '.hazard.txt';
        $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
            xhrFields: {withCredentials: false},
            success: successfn,
            error: errorfn
        });

        function successfn(data) {

            var lines = data.split("\n");
            var array = [];
            for (var i = 0; i < lines.length; i++) {

                if (lines[i].indexOf(";") === -1) {
                    if (array.length > 0) {
                        w.viewer.entities.add({
                            polygon: {
                                hierarchy: Cesium.Cartesian3.fromDegreesArray(array),
                                material: Cesium.Color.RED.withAlpha(0.3),
                                outline: true,
                                outlineColor: Cesium.Color.RED
                            }
                        });
                        array = [];
                    }
                }

                if (lines[i].indexOf(";") > -1) {
                    var data = lines[i].split(";");
                    array.push(data[0], data[1]);
                }
            }

            $scope.getEventsFile(0);
        }

        function errorfn(data) {
            $scope.getEventsFile(0);
        }
    };

    $scope.getDataFile = function (stage) {

        var url = $scope.$parent.client + '/output/' + w.getProp('id') + '_' + stage + '.dat';
        $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
            xhrFields: {withCredentials: false},
            success: successfn,
            error: errorfn
        });

        function successfn(data) {

            var lines = data.split("\n");

            var p_stage = new Cesium.SampledPositionProperty();
            var trajectory = new Cesium.SampledPositionProperty();

            var launchDate = new Date($scope.launchTime);

            var start = Cesium.JulianDate.fromDate(launchDate);
            var stop = Cesium.JulianDate.addSeconds(start, 600000, new Cesium.JulianDate());

            var t = 0;
            fullData[stage] = [];
            max[stage] = [];
            for (var i = 2; i < lines.length; i++) {

                if (lines[i] === "")
                    continue;

                var data = lines[i].split(";");
                if(data.length === 1)
                    data = lines[i].split("\t");
                fullData[stage][parseInt(data[0])] = parseFloat(data[6]) + ":" + parseFloat(data[4]) + ":" + parseFloat(data[5]) + ":" + parseFloat(data[21]) * Math.PI / 180 + ":" + (parseFloat(data[16]) - 90) * Math.PI / 180;

                var focus = false;
                var ign = false;
                for (var j = 1; j < focusPoints.length; j++) {
                    if (Math.abs(data[0] - focusPoints[j][0]) <= 0.5) {
                        focus = true;
                        ign = focusPoints[j - 1][1] > 0.1;
                        break;
                    }
                }

                if (!focus && data[0] > 1000 && i % 100 !== 0)
                    continue;

                if (t < 600 && parseFloat(data[4]) > max[stage]["altitude"] || max[stage]["altitude"] === undefined)
                    max[stage]["altitude"] = Math.ceil(parseFloat(data[4]) / 100) * 100;
                if (t < 600 && parseFloat(data[5]) > max[stage]["velocity"] || max[stage]["velocity"] === undefined)
                    max[stage]["velocity"] = Math.ceil(parseFloat(data[5]) / 500) * 500;

                t = parseInt(data[0]);
                var x = parseFloat(data[1 + offset]);
                var y = parseFloat(data[2 + offset]);
                var z = parseFloat(data[3 + offset]);
                var h = parseFloat(data[4]) * 1e3;

                var lat = 180 * Math.atan(z / Math.sqrt(x * x + y * y)) / Math.PI;
                var lon = 180 * Math.atan2(y, x) / Math.PI;

                var time = Cesium.JulianDate.addSeconds(start, t, new Cesium.JulianDate());
                var position = Cesium.Cartesian3.fromDegrees(lon, lat, h);
                trajectory.addSample(time, position);
                p_stage.addSample(time, position);

                if (focus) {
                    var e = w.viewer.entities.add({
                        availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({start: start, stop: stop})]),
                        position: trajectory,
                        path: {resolution: 1, material: new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, color: ign ? Cesium.Color.RED : Cesium.Color.YELLOW}), width: 8}
                    });
                    e.position.setInterpolationOptions({
                        interpolationDegree: 5,
                        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
                    });

                    trajectory = new Cesium.SampledPositionProperty();
                    trajectory.addSample(time, position);
                }
                throttle = parseFloat(data[12]);

            }

            var ign = focusPoints[focusPoints.length - 1][1] > 0.1;
            var e = w.viewer.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({start: start, stop: stop})]),
                position: trajectory,
                path: {resolution: 1, material: new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, color: ign ? Cesium.Color.RED : Cesium.Color.YELLOW}), width: 8}
            });
            e.position.setInterpolationOptions({
                interpolationDegree: 5,
                interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
            });

            if (w.getProp('w') !== undefined) {
                var pinBuilder = new Cesium.PinBuilder();
                w.entities[stage] = w.viewer.entities.add({
                    position: p_stage,
                    path: {resolution: 1, material: new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, color: Cesium.Color.TRANSPARENT}), width: 1},
                    billboard: {
                        image: pinBuilder.fromText(stage + 1, Cesium.Color.ROYALBLUE, 32).toDataURL(),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                    }
                });
                w.entities[stage].position.setInterpolationOptions({
                    interpolationDegree: 5,
                    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
                });
            }

            $scope.getEventsFile(stage + 1);
        }

        function errorfn(data) {
            void 0;
        }
    };

    $scope.getEventsFile = function (stage) {
        var url = $scope.$parent.client + '/output/' + w.getProp('id') + '_' + stage + '_events.dat';
        $.ajax({type: 'GET', url: url, contentType: 'text', data: null,
            xhrFields: {withCredentials: false},
            success: successfn,
            error: errorfn
        });

        function successfn(data) {

            if (data.indexOf("html") !== -1) {
                $scope.start();
            } else {
                
                var lines = data.split("\n");
                eventsData[stage] = [];

                focusPoints = [];
                for (var i = 1; i < lines.length; i++) {
                    var data = lines[i].split(";");
                    if(data.length === 1)
                        data = lines[i].split("\t");

                    if (data.length === 1)
                        continue;

                    eventsData[stage][parseInt(data[0])] = parseFloat(data[12]); // eventsData[time] = throttle
                    focusPoints.push([parseFloat(data[0]), parseFloat(data[12])]);

                    var x = parseFloat(data[1 + offset]); //offset=17
                    var y = parseFloat(data[2 + offset]);
                    var z = parseFloat(data[3 + offset]);
                    var h = parseFloat(data[4]) * 1e3;

                    var lat = 180 * Math.atan(z / Math.sqrt(x * x + y * y)) / Math.PI;
                    var lon = 180 * Math.atan2(y, x) / Math.PI;

                    w.viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(lon, lat, h),
                        point: {pixelSize: 5, color: Cesium.Color.TRANSPARENT, outlineColor: Cesium.Color.RED, outlineWidth: 1}
                    });
                }

                $scope.getDataFile(stage);
            }
        }

        function errorfn(data) {
            void 0;
        }
    };

    $scope.start = function () {

        if ($scope.queryParams['w'] !== undefined) {
            $scope.fillFutureArray();

            // just load up the futures
            $scope.loadFlot(function () {
                var altData = [], velData = [];
                for (var s = 0; s < $scope.numStages; s++) {
                    altData.push({data: future[s]["alt"], color: '#aaaaaa', lineWidth: 1, lines: {show: true, fill: false}});
                    velData.push({data: future[s]["vel"], color: '#aaaaaa', lineWidth: 1, lines: {show: true, fill: false}});
                }

                plot["altitude"].setData(altData);
                plot["altitude"].draw();

                plot["velocity"].setData(velData);
                plot["velocity"].draw();
            });

            // track entity here so plot resize doesn't throw any errors before T-10s
            w.trackEntity(0);
            $interval(function() {
                $scope.update();
            }, 1000);
        }
        /*
         setInterval(function () {
         var heading = 180.0 * w.viewer.camera.heading / Math.PI;
         var pitch = 180.0 * w.viewer.camera.pitch / Math.PI;
         var roll = 180.0 * w.viewer.camera.roll / Math.PI;
         var matrix = w.viewer.camera.inverseViewMatrix;
         var pos1 = Math.sqrt(matrix[12] * matrix[12] + matrix[13] * matrix[13]);
         var pos2 = matrix[14];
         var lat = 180.0 * Math.atan(pos2 / pos1) / Math.PI;
         var lon = -90.0-(180.0 * Math.atan(matrix[12] / matrix[13]) / Math.PI);
         var radius = Math.sqrt(matrix[12] * matrix[12] + matrix[13] * matrix[13] + matrix[14] * matrix[14]);
         var height = radius - 6378137;
         console.log("long/lat/height =    " + lon + "/" + lat + "/" + height);
         console.log("heading/pitch/roll = " + heading + "/" + pitch + "/" + roll);
         }, 5000);
         */
    };

    $scope.update = function () {

        var currentTime = Cesium.JulianDate.toDate(w.viewer.clock.currentTime);
        var time = (currentTime - $scope.launchTime) / 1000;
        time = parseInt(time);

        if (time >= -10) { // only execute this code after T-00:00:10

            if (w.getTrackedStage() === undefined) {
                $scope.clickStage(0);
            }

            var stage = w.getTrackedStage();

            if (fullData[stage] !== undefined && fullData[stage][time] !== undefined)
            {
                var tel = fullData[stage][time].split(":");
                $("#altitudeTel").html('ALTITUDE: ' + (tel[1] < 1 ? 1000 * tel[1] + ' M' : Math.floor(10 * tel[1]) / 10 + ' KM'));
                $("#velocityTel").html('VELOCITY: ' + Math.floor(tel[2]) + ' M/S');
            } else if (fullData[stage - 1] !== undefined && fullData[stage - 1][time] !== undefined)
            {
                var tel = fullData[stage - 1][time].split(":");
                $("#altitudeTel").html('ALTITUDE: ' + (tel[1] < 1 ? 1000 * tel[1] + ' M' : Math.floor(10 * tel[1]) / 10 + ' KM'));
                $("#velocityTel").html('VELOCITY: ' + Math.floor(tel[2]) + ' M/S');
            } else
            {
                $("#altitudeTel").html('ALTITUDE: 0 KM');
                $("#velocityTel").html('VELOCITY: 0 M/S');
            }

            if (time <= 600) {

                var altData = [];
                var velData = [];
                for (var s = 0; s < $scope.numStages; s++) {
                    for (var i = w.plottedTime; i <= time; i++) {

                        if (fullData[s][i] === undefined) {
                            if (fullData[s - 1] !== undefined && fullData[s - 1][i] !== undefined)
                            {
                                var tel = fullData[s - 1][i].split(":");
                                w.entities[s].orientation = Cesium.Transforms.headingPitchRollQuaternion(w.entities[s].position.getValue(time), tel[3], tel[4], 0);
                                vel[s][0].push([i, tel[2]]);
                                alt[s][0].push([i, tel[1]]);

                                if (eventsData[s - 1][i] !== undefined)
                                {
                                    vel[s][1].push([i, tel[2]]);
                                    alt[s][1].push([i, tel[1]]);
                                }
                            }
                        } else
                        {
                            var tel = fullData[s][i].split(":");
                            w.entities[s].orientation = Cesium.Transforms.headingPitchRollQuaternion(w.entities[s].position.getValue(time), tel[3], tel[4], 0);
                            vel[s][0].push([i, tel[2]]);
                            alt[s][0].push([i, tel[1]]);

                            if (eventsData[s][i] !== undefined)
                            {
                                vel[s][1].push([i, tel[2]]);
                                alt[s][1].push([i, tel[1]]);
                            }
                        }
                    }

                    altData.push({data: future[s]["alt"], color: '#aaaaaa', lineWidth: 1, lines: {show: true, fill: false}});
                    altData.push({data: alt[s][0], color: stageColours[s], lineWidth: 1, lines: {show: true, fill: stage === s}});
                    altData.push({data: alt[s][1], lines: {show: false}, points: {show: true}});

                    velData.push({data: future[s]["vel"], color: '#aaaaaa', lineWidth: 1, lines: {show: true, fill: false}});
                    velData.push({data: vel[s][0], color: stageColours[s], lineWidth: 1, lines: {show: true, fill: stage === s}});
                    velData.push({data: vel[s][1], lines: {show: false}, points: {show: true}});

                }
                w.plottedTime = time + 1;

                plot["altitude"].setData(altData);
                plot["altitude"].draw();

                plot["velocity"].setData(velData);
                plot["velocity"].draw();
            }
        }

    };


    $scope.fillFutureArray = function () {

        for (var stage = 0; stage < $scope.numStages; stage++) {
            future[stage] = [];
            future[stage]["alt"] = [];
            future[stage]["vel"] = [];
            for (var i = -5; i < 600; i++) {

                if (fullData[stage][i] === undefined)
                    continue;

                var tel = fullData[stage][i].split(":");
                future[stage]["alt"].push([i, tel[1]]);
                future[stage]["vel"].push([i, tel[2]]);
            }
        }
        for (var stage = 0; stage < $scope.numStages; stage++) {

            $("#altitudeTel").html('ALTITUDE: 0 KM');
            $("#velocityTel").html('VELOCITY: 0 M/S');

        }
    };

    $scope.plotResize = function (considerSidebar) {

        for (var stage = 0; stage < 2; stage++) {
            var width = fullWidth <= 456 ? fullWidth - 56 : fullWidth >= 960 ? 400 : 320;
            $("#altitudePlot").width(width);
            $("#velocityPlot").width(width);
            $("#altitudePlot").height(width / 1.6);
            $("#velocityPlot").height(width / 1.6);
        }
        var w2;
        var fullWidth = $(document.body)[0].clientWidth;
        if (considerSidebar) {
            $scope.initialisePlot("altitude", w.getTrackedStage());
            $scope.initialisePlot("velocity", w.getTrackedStage());
            var width = fullWidth < 456 ? fullWidth - 56 : fullWidth > 960 ? 400 : 320;
            w2 = fullWidth - width;
        } else {
            w2 = fullWidth;
        }
        $("#cesiumContainer").width(w2);
        
    };

    $(window).resize(function () {
        $scope.plotResize($(document.body)[0].clientWidth >= 960);
    });

    ////////////////////////////////////////////////////////////////////////////

    function world() {

        this.setCameraLookingAt = function (site) {
            w.viewer.camera.flyTo(launchPadViews[site]);
        };

        var trackedStage = 0;
        this.trackEntity = function (stage) {
            if (w.viewer.trackedEntity !== w.entities[stage]) {
                w.trackedStage = stage;
                w.viewer.trackedEntity = w.entities[stage];
                w.viewer.camera.zoomOut();
            }
        };

        this.getTrackedStage = function () {
            return w.trackedStage;
        };

        var w = this;
        var entities; // map of Cesium stage entities

        var props = {};
        this.setProps = function (p) {
            w.props = p;
        };
        this.setProp = function (name, value) {
            w.props[name] = value;
        };
        this.getProp = function (key) {
            if (w.props.hasOwnProperty(key)) {
                return w.props[key];
            }
            return undefined;
        };
        this.getProps = function () {
            return w.props;
        };

        var viewer;

        var launchPadViews = {};

        launchPadViews['LC4E'] = {
            destination: Cesium.Cartesian3.fromDegrees(-128.654, 27.955, 772000.0),
            orientation: {
                heading: Cesium.Math.toRadians(67.776),
                pitch: Cesium.Math.toRadians(-36.982),
                roll: Cesium.Math.toRadians(359.873)
            }
        };
        launchPadViews['LC40'] = {
            destination: Cesium.Cartesian3.fromDegrees(-76.162, 19.863, 480000.0),
            orientation: {
                heading: Cesium.Math.toRadians(356.939),
                pitch: Cesium.Math.toRadians(-26.816),
                roll: Cesium.Math.toRadians(359.795)
            }
        };
        launchPadViews['K39A'] = launchPadViews['LC40'];
        launchPadViews['BOCA'] = {
            destination: Cesium.Cartesian3.fromDegrees(-94.706, 15.725, 1108500.0),
            orientation: {
                heading: Cesium.Math.toRadians(355.6),
                pitch: Cesium.Math.toRadians(-43.032),
                roll: Cesium.Math.toRadians(359.8)
            }
        };
        launchPadViews['BOWT'] = {
            destination: Cesium.Cartesian3.fromDegrees(-103.824, 21.348, 450395.0),
            orientation: {
                heading: Cesium.Math.toRadians(357.51),
                pitch: Cesium.Math.toRadians(-21.66),
                roll: Cesium.Math.toRadians(359.93)
            }
        };

    }
    
    $scope.openCesiumCreditsDialog = function ($event) {
        $mdDialog.show({
            controller: function () {
                $scope.hide = function () {
                    $mdDialog.hide();
                };

                $scope.cancel = function () {
                    $mdDialog.cancel();
                };

                $scope.answer = function (answer) {
                    $mdDialog.hide(answer);
                };
            },
            contentElement: '#myDialog',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true
        });
    };
});
