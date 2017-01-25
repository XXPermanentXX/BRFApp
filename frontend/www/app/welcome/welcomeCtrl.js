angular.module('civis.youpower.welcome').controller('WelcomeCtrl', WelcomeCtrl);

function WelcomeCtrl($scope, $state, $stateParams, $window, $location, AuthService) {
  var token = $location.search().access_token;
  var err = $location.search().err;
  var callback = $stateParams.callback;

  /**
   * Handle success callback and redirect
   */

  if (callback === 'success') {
    if ($window.opener) {
      return $window.opener.dispatchEvent(new CustomEvent('METRY_AUTH', {
        detail: { accessToken: token }
      }));
    }

    AuthService.storeToken(token);

    return $state.go('main.cooperative.my');
  }

  /**
   * Forwards callback error to window opener
   */

  if (callback === 'error') {
    if ($window.opener) {
      return $window.opener.dispatchEvent(new CustomEvent('METRY_AUTH', {
        detail: { err: err }
      }));
    }
  }

  /**
   * Default to loading state
   */

  $scope.isLoading = true;

  /**
   * Check whether the user is authenticated
   */

  AuthService.isAuthenticated().then(function (isAuthenticated) {
    if (isAuthenticated) {
      return $state.go('main.cooperative.my');
    }

    $scope.auth = {
      err: err,
      isRejected: false
    };

    $scope.isLoading = false;
    $scope.signinClicked = false;

    $scope.signin = function () {
      $scope.signinClicked = true;

      AuthService.login().then(function () {
        $scope.signinClicked = false;
        $state.go('main.cooperative.my');
      }, function (err) {
        $scope.auth.isRejected = true;
        $scope.auth.err = err;
      });
    };
  });
}
