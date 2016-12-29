'use strict';

angular
  .module('civis.youpower')
  .service('AuthService', function($q, $http, $window, $timeout, $location, $translate, Config) {
    var LOCAL_TOKEN_KEY = 'CIVIS_TOKEN';
    var isAuthenticated = false;
    var isAdmin = false;
    var BASE_URL = 'https://app.metry.io/';
    var PATH_AUTHORIZE = 'oauth/authorize';
    var CLIENT_ID = 'civis_youpower';
    var REDIRECT_URI = location.origin + '/auth';
    var POPUP_WIDTH = 500;
    var POPUP_HEIGHT = 700;

    function loadUserCredentials() {
      var token = $window.localStorage.getItem(LOCAL_TOKEN_KEY);
      if (token) {
        useCredentials(token);
      }
    }

    function storeUserCredentials(token) {
      $window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
      useCredentials(token);
    }

    function useCredentials(token) {
      isAuthenticated = true;

      // Set the token as header for your requests!
      $http.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }

    function destroyUserCredentials() {
      isAuthenticated = false;
      isAdmin = false;
      $http.defaults.headers.common['Authorization'] = undefined;
      $window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    function signup(email, name, password, language, testLocation, contractId, household) {
      return $q(function(resolve, reject) {

        $http.post(Config.host + '/api/user/register', {
          email: email,
          name: name,
          password: password,
          language: language,
          testLocation: testLocation,
          contractId: contractId,
          household: household
        })
        .success(function(data) {
          storeUserCredentials(data.token);
          resolve('Sign success.');
        })
        .error(function(data) {
          reject(data);
        });

      });
    }

    function getCode() {
      var url = '//localhost:3000/api/auth/metry';
      var top = (screen.height - POPUP_HEIGHT) / 2;
      var left = (screen.width - POPUP_WIDTH) / 2;
      var features = 'width=' + POPUP_WIDTH +
        ',height=' + POPUP_HEIGHT +
        ',top=' + top +
        ',left=' + left +
        ',status=0,menubar=0,toolbar=0,personalbar=0';

      return $q(function(resolve, reject) {
        var authWindow, checkInterval;

        try {
          /**
           * Try and open popup authentification window
           */

          authWindow = window.open(url, 'mryAuthWindow', features);

          /**
           * Set up a listener for authentification callback
           */

          $window.addEventListener('METRY_AUTH', function onAuth(event) {
            // Remove event listener
            $window.removeEventListener('METRY_AUTH', onAuth);

            // Close popup window and clear checking interval
            authWindow.close();
            clearInterval(checkInterval);

            // Callback
            if (event.detail.access_token) {
              return resolve(event.detail.access_token);
            }

            switch (event.detail.err) {
              case 'METRY_ERROR': return reject($translate.instant('LOGIN_DENIED'));
              default: return reject(event.detail.err);
            }
          });
        } catch (err) {
          /**
           * Fallback to redirect whole window
           */

          return $location.path(url).replace();
        }

        /**
         * Reject if popoup window has been closed manually
         */

        checkInterval = setInterval(function() {
          if (authWindow.closed) {
            clearInterval(checkInterval);
            return reject($translate.instant('LOGIN_ABORTED'));
          }
        }, 200);
      });
    }

    function login() {
      return getCode().then(function (token) {
        storeUserCredentials(token);
        return 'Login success.';
      });
    }

    function checkAdmin() {
      return $q(function(resolve, reject) {
        if (!isAuthenticated) {
          reject('Not logged in');
          return;
        }
        if (isAdmin) {
          resolve(true);
          return;
        }
        $http.get(Config.host + '/api/admin/')
          .success(function() {
            isAdmin = true;
            resolve(true);
          })
          .error(reject);
      });
    }

    function loginAdmin() {
      isAdmin = false;
      return login().then(checkAdmin);
    }

    function logout() {
      destroyUserCredentials();
    }

    loadUserCredentials();

    return {
      login: login,
      loginAdmin: loginAdmin,
      logout: logout,
      signup: signup,
      storeToken: storeUserCredentials,
      isAdmin: checkAdmin,
      isAuthenticated: function() {
        return isAuthenticated;
      },
      getToken: function() {
        return $window.localStorage.getItem(LOCAL_TOKEN_KEY);
      }
    };
  });
