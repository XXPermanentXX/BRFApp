angular.module('civis.youpower.welcome').controller('WelcomeCtrl', WelcomeCtrl);

function WelcomeCtrl($scope, $state, $stateParams, $window, $location, AuthService) {
  var token = $location.search().access_token;
  var err = $location.search().err;
  var callback = $stateParams.callback;

  if (AuthService.isAuthenticated()) {
    return $state.go('main.cooperative.my');
  }

  if (callback === 'success') {
    if ($window.opener) {
      $window.opener.dispatchEvent(new CustomEvent('METRY_AUTH', {
        detail: { access_token: token }
      }));
    }

    AuthService.storeToken(token);

    $state.go('main.cooperative.my');
  }

  if (callback === 'error') {
    if ($window.opener) {
      $window.opener.dispatchEvent(new CustomEvent('METRY_AUTH', {
        detail: { err: err }
      }));
    }
  }

  $scope.auth = {
    err: err,
    isRejected: false
  };

  $scope.signinClicked = false;

  $scope.signin = function() {
    $scope.signinClicked = true;

    AuthService.login().then(function () {
      $scope.signinClicked = false;
      $state.go('main.cooperative.my');
    }, function (err) {
      $scope.auth.isRejected = true;
      $scope.auth.err = err;
    })
  }
}
