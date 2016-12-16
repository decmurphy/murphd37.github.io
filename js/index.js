angular.module('FlightClub').controller('IndexCtrl', function ($scope, $mdSidenav, $cookies, $location, $window, $interval) {
    
    var base, port;
    if($location.host() === 'localhost') {
        base= 'http://localhost';
        port = ':8080';
    } else {
        base = '//'+$location.host();
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