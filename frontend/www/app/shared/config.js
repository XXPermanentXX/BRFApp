angular.module('civis.youpower')

.factory('Config', function() {
  return {
    host: '{{BRFENERGI_CLIENT_URL}}'
  };
});
