'use strict';

angular
  .module('civis.youpower')
  .service('GeoIP', function ($q, $http, Config) {

    /**
     * Wrapper for location service that caches response after first call
     */

    var getLocation = (function () {
      var location;

      return function resolve() {
        return $q(function (resolve, reject) {
          if (location) { return resolve(location); }

          return $http.get(Config.host + '/api/services/geoip')
            .then(function (res) {
              location = res.data;
              resolve(location);
            }, reject);
        });
      };
    }());

    /**
     * Extract latitude and longitude from location data
     */

    function getLatLng() {
      return getLocation().then(function (location) {
        return [ location.latitude, location.longitude ];
      });
    }

    return {
      getLatLng: getLatLng
    };
  });
