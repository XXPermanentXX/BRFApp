angular.module('civis.youpower')

.factory('Config', function() {
  return {
    host: '{{BRFENERGI_SERVICE_URL}}'
  };
});
