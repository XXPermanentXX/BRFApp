angular.module('civis.youpower.main', [])
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind('keydown keypress', function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter, {
              'event': event
            });
          });
          event.preventDefault();
        }
      });
    };
  })
  .controller('AppCtrl', AppCtrl);

/* The controller that should always be on top of routing
hierarchy as it will be loaded with abstract main state.
Here we can do the general app stuff like getting the user's
details (since this is after the user logs in).
----------------------------------------------*/
function AppCtrl($scope, $state, $ionicHistory, $timeout, $ionicViewSwitcher, $ionicLoading, User, Actions, Household, AuthService, $translate, currentUser) {

  $scope.currentUser = currentUser;

  $scope.actions = {}; //save action details

  $scope.commentPoints = 1;
  $scope.feedbackPoints = 1;

  $scope.households = {}; //save information of households

  $scope.users = {}; //save user details. not the current user, the other household members and invited members

  $scope.loadHouseholdsDetails = function (households) {

    for (var i = 0; i < households.length; i++) {
      $scope.loadHouseholdProfile(households[i]);
    }

  };

  $scope.loadHouseholdProfile = function (householdId, cb) {

    if (householdId === null) return;

    Household.get({
      id: householdId
    }).$promise.then(function (data) {

      $scope.households[householdId] = data;

      $scope.loadUsersDetails(data.members);
      $scope.loadUsersDetails(data.pendingInvites);
      $scope.loadUserProfile(data.ownerId);

      if (typeof cb === 'function') cb();
    });
  };


  $scope.loadUsersDetails = function (users) {

    for (var i = 0; i < users.length; i++) {
      $scope.loadUserProfile(users[i]);
    }
  };


  $scope.loadUserProfile = function (userId) {

    if (userId === null || userId === $scope.currentUser._id || $scope.users[userId]) return;

    User.getUserProfile({
      userId: userId
    }).$promise.then(function (data) {
      $scope.users[userId] = data;
      $scope.loadActionDetails($scope.users[userId].actions.inProgress);
    });
  };

  $scope.toRehearseSelectAll = function () {
    $scope.currentUser.profile.toRehearse = {
      setByUser: true,
      declined: true,
      done: true,
      na: true
    };
  };

  $scope.toRehearseDeselectAll = function () {
    $scope.currentUser.profile.toRehearse = {
      setByUser: true,
      declined: false,
      done: false,
      na: false
    };
  };

  $scope.toRehearseSet = function () {
    $scope.currentUser.profile.toRehearse.setByUser = true;
  };
  $scope.isSetRehearse = function () {
    return $scope.currentUser.profile.toRehearse.setByUser;
  };

  $scope.isToRehearse = function () {
    var a = $scope.currentUser.profile.toRehearse;
    return a.setByUser && (a.declined || a.done || a.na);
  };

  $scope.isNotToRehearse = function () {
    var a = $scope.currentUser.profile.toRehearse;
    return a.setByUser && !a.declined && !a.done && !a.na;
  };

  $scope.loadActionDetails = function (actions) {
    if (_.isArray(actions)) {
      for (var i = 0; i < actions.length; i++) {
        $scope.addActionById(actions[i]._id);
      }
    } else {
      angular.forEach(actions, function (value, key) {
        $scope.addActionById(key);
      });
    }
  };

  $scope.addActionById = function (actionId, cb) {

    if (!$scope.actions[actionId]) {
      Actions.getActionById({
        id: actionId
      }).$promise.then(function (data) {

        $scope.actions[data._id] = data;

        $scope.$broadcast('Action loaded', {
          actionId: data._id
        });

        if (typeof cb === 'function') cb();
      });
    } else if (typeof cb === 'function') cb();
  };

  //update local list
  $scope.removeActionById = function (actionId) {
    if ($scope.actions[actionId]) {
      delete $scope.actions[actionId];
    }
  };

  $scope.isInvitedToHousehold = function (userId) {

    if ($scope.currentUser.householdId &&
      _.indexOf($scope.households[$scope.currentUser.householdId].pendingInvites, userId) > -1) {
      return true;
    } else return false;
  };

  $scope.isInYourHousehold = function (userId) {

    if ($scope.currentUser.householdId &&
      _.indexOf($scope.households[$scope.currentUser.householdId].members, userId) > -1) {
      return true;
    } else return false;
  };

  $scope.addFeedbackPoints = function () {
    $scope.currentUser.leaves += $scope.feedbackPoints;
  };

  $scope.addCommentPoints = function () {
    $scope.currentUser.leaves += $scope.commentPoints;
  };

  $scope.deductCommentPoints = function () {
    $scope.currentUser.leaves -= $scope.commentPoints;
  };

  $scope.addActionPoints = function (action) {
    $scope.currentUser.leaves += action.impact + action.effort;
  };

  $scope.getActionPoints = function (action) {
    return action.effort + action.impact;
  };

  $scope.salut = function () {
    var name = $scope.currentUser.profile.name ? $scope.currentUser.profile.name : $scope.currentUser.email;
    return $translate.instant('Hi') + ' ' + name + '!';
  };

  $scope.gotoYourActions = function () {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('main.actions.yours');
  };

  $scope.gotoHouseholdActions = function () {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go('main.actions.household');
  };


  $scope.gotoSettings = function () {
    $ionicViewSwitcher.nextDirection('forward'); // forward, back, enter, exit, swap
    $state.go('main.settings.index');
  };

  $scope.gotoYourSettings = function () {
    $ionicViewSwitcher.nextDirection('forward'); // forward, back, enter, exit, swap
    $state.go('main.settings.personal');
  };

  $scope.disableBack = function () {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
  };

  $scope.goBack = function () {
    $ionicHistory.goBack();
  };

  $scope.toSignout = false;

  $scope.isToSignout = function () {
    return $scope.toSignout;
  };

  $scope.clearToSignout = function () {
    $scope.toSignout = false;
  };

  $scope.profileChanged = {
    personal: false,
    houseInfo: false,
    householdComposition: false,
    appliancesList: false
  };

  $scope.isProfileChanged = function () {
    return $scope.profileChanged.personal || $scope.profileChanged.houseInfo || $scope.profileChanged.householdComposition || $scope.profileChanged.appliancesList;
  };
  $scope.setHouseInfoChanged = function () {
    $scope.profileChanged.houseInfo = true;
  };
  $scope.setHouseholdCompositionChanged = function () {
    $scope.profileChanged.householdComposition = true;
  };
  $scope.setAppliancesListChanged = function () {
    $scope.profileChanged.appliancesList = true;
  };
  $scope.clearHouseholdProfileChanged = function () {
    $scope.profileChanged.houseInfo = false,
      $scope.profileChanged.householdComposition = false,
      $scope.profileChanged.appliancesList = false;
  };
  $scope.isHouseholdProfileChanged = function () {
    return $scope.profileChanged.houseInfo || $scope.profileChanged.householdComposition || $scope.profileChanged.appliancesList;
  };
  $scope.isHouseInfoChanged = function () {
    return $scope.profileChanged.houseInfo;
  };
  $scope.isHouseholdCompositionChanged = function () {
    return $scope.profileChanged.householdComposition;
  };
  $scope.isAppliancesListChanged = function () {
    return $scope.profileChanged.appliancesList;
  };
  $scope.setPersonalProfileChanged = function () {
    $scope.profileChanged.personal = true;
  };
  $scope.clearPersonalProfileChanged = function () {
    $scope.profileChanged.personal = false;
  };
  $scope.isPersonalProfileChanged = function () {
    return $scope.profileChanged.personal;
  };

  $scope.login = function () {
    $state.go('welcome');
  };

  $scope.signout = function () {
    if ($scope.isProfileChanged()) {
      $scope.toSignout = true;
      $state.go('welcome');
    } else {
      $scope.logout();
    }
  };


  $scope.logout = function () {
    AuthService.logout().then(function () {
      redirect();

      $timeout(function () {
        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
      }, 1500);
    }, redirect);

    function redirect() {
      $state.go('welcome');
    }
  };

  $scope.showLoading = function () {
    $ionicLoading.show({
      template: '<ion-spinner icon="ion-load-a"></ion-spinner>',
      hideOnStageChange: true
    });
  };

  $scope.hideLoading = function () {
    $ionicLoading.hide();
  };

  $scope.isStateOrParent = function (stateName) {
    return $state.includes(stateName);
  };

  //comments are loaded later automatically at the action details view
}
