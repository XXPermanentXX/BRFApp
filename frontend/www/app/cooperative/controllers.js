'use strict';

function coop(id, $scope, $timeout, $state, $q, $stateParams, $translate, $ionicPopup, Cooperatives, $location, $ionicScrollDelegate, cooperativeSelection) {
  $scope.actionTypes = Cooperatives.getActionTypes();
  $scope.cooperatives = Cooperatives.query();


  $scope.$on('$ionicView.enter', function() {
    // A cooperative have been selected to compare with
    if (!(_.isEmpty(cooperativeSelection.getSelection().cooperative))) {
      $scope.energyGraphSettings['selectedCooperative'] = cooperativeSelection.getSelection().cooperative;
      $scope.energyGraphSettings.compareTo = 'Housing_Cooperatives';
      $scope.$broadcast('updateData');
    }
    // Get the cooperative, currently hardcoded
    Cooperatives.get({
      id: id
    }, function(data) {
      $scope.cooperative = data;
      $scope.cooperative.actions = _.sortBy($scope.cooperative.actions, function(a) {
        return new Date(a.date);
      }).reverse();
      $scope.$broadcast('civisEnergyGraph.init');
      mixpanel.track('Cooperative viewed', {
        name: data.name
      });
    });
  });

  $scope.energyGraphSettings = {
    granularity: 'monthly',
    compareTo: 'GRAPH_COMPARE_PREV_YEAR',
    type: 'heating',
    unit: 'kWh/m<sup>2</sup>',
    granularities: ['monthly', 'yearly'],
    types: [{
      name: 'heating',
      cssClass: 'positive'
    }, {
      name: 'electricity',
      cssClass: 'balanced'
    }],
    comparisons: [{
      name: 'GRAPH_COMPARE_PREV_YEAR'
    }, {
      name: 'GRAPH_COMPARE_AVG'
    }, {
      name: 'Housing_Cooperatives'
    }],
    normalized: false
  };

  $scope.performanceYear = new Date();
  $scope.performanceYear.setFullYear($scope.performanceYear.getFullYear() - 1);

  $scope.goToAction = function(action) {
    $scope.$broadcast('goToActionInGraph', {
      actionId: action._id
    });
  };

  $scope.scrollTo = function(id) {
    $location.hash(id);
    $ionicScrollDelegate.anchorScroll();
  };

  $scope.actionFilter = function(action) {
    var type = $scope.energyGraphSettings.type == 'electricity' ? 200 : 100;
    return action.types.indexOf(type) >= 0;
  };

  $scope.commentAction = function(action) {
    Cooperatives.commentAction({
      id: $scope.cooperative._id,
      actionId: action._id,
      comment: action.newComment
    }, {
      comment: action.newComment
    }, function(comment) {
      action.comments.push(comment);
      action.commentsCount++;
      action.newComment = undefined;
      mixpanel.track('Cooperative Action Comment added', {
        'action name': action.name,
        'action id': action._id
      });
    });
  };

  $scope.loadMoreComments = function(action) {
    Cooperatives.getMoreComments({
      id: $scope.cooperative._id,
      actionId: action._id,
      lastCommentId: _.last(action.comments)._id
    }, function(comments) {
      Array.prototype.push.apply(action.comments, comments);
    });
  };

  $scope.deleteActionComment = function(action, comment) {
    Cooperatives.deleteActionComment({
      id: $scope.cooperative._id,
      actionId: action._id,
      commentId: comment._id
    }, function() {
      action.comments.splice(action.comments.indexOf(comment), 1);
      action.commentsCount--;
      mixpanel.track('Cooperative Action Comment deleted', {
        'action name': action.name,
        'action id': action._id
      });
    });
  };

  $scope.performanceInfo = function() {
    $ionicPopup.show({
      title: $translate.instant('COOPERATIVE_PERFORMANCE'),
      template: $translate.instant('COOPERATIVE_PERFORMANCE_DESCRIPTION', {
        year: $scope.performanceYear,
        value: $scope.cooperative.performance
      }),
      cssClass: 'popup-custom',
      buttons: [{
        text: 'OK',
        type: 'button-clear popup-button'
      }]
    });
  };

  $scope.trackActionClicked = function(action) {
    mixpanel.track('Cooperative Action expanded', {
      'action name': action.name,
      'action id': action._id
    });
  };
}

angular.module('civis.youpower.cooperatives', ['highcharts-ng'])

.controller('CooperativeCtrl', function(currentUser, $scope, $timeout, $state, $q, $stateParams, $translate, $ionicPopup, Cooperatives, $location, $ionicScrollDelegate, cooperativeSelection) {
  $scope.currentUser = currentUser;
  coop(currentUser.cooperativeId, $scope, $timeout, $state, $q, $stateParams, $translate, $ionicPopup, Cooperatives, $location, $ionicScrollDelegate, cooperativeSelection);
})

.controller('OtherCooperativeCtrl', function($scope, $timeout, $state, $q, $stateParams, $translate, $ionicPopup, Cooperatives, $location, $ionicScrollDelegate, cooperativeSelection) {
  coop($stateParams.id, $scope, $timeout, $state, $q, $stateParams, $translate, $ionicPopup, Cooperatives, $location, $ionicScrollDelegate, cooperativeSelection);
})

.controller('CooperativeEditCtrl', function($scope, $state, Cooperatives, currentUser, $ionicPopup, $translate) {
  $scope.actionTypes = Cooperatives.getActionTypes();

  $scope.ventilationTypes = _.map(Cooperatives.VentilationTypes, function(type) {
    return {
      type: type,
      checked: false
    };
  });
  $scope.ventilationTypesSelected = {};

  $scope.$on('$ionicView.enter', function() {
    // Get the cooperative, currently hardcoded
    Cooperatives.get({
      id: currentUser.cooperativeId
    }, function(data) {
      $scope.cooperative = data;
    });
  });

  $scope.save = function() {
    Cooperatives.update({
      id: $scope.cooperative._id
    }, $scope.cooperative, function() {
      $state.go('^');
      mixpanel.track('Cooperative updated', {
        id: $scope.cooperative._id,
        name: $scope.cooperative.name
      });
    });
  };

  $scope.selectVentilationTypes = function() {
    var categoryPopUp = $ionicPopup.show({
      scope: $scope,
      title: $translate.instant('COOPERATIVE_VENTILATION_TYPE'),
      templateUrl: 'app/cooperative/ventilationTypesPopUp.html',
      cssClass: 'popup-custom',
      buttons: [{
        text: 'OK',
        type: 'button-clear popup-button',
        onTap: function() {
          // Returning a value will cause the promise to resolve with the given value.
          return true;
        }
      }]
    });
    categoryPopUp.then(function() {
      $scope.cooperative.ventilationType = _.map(_.where($scope.ventilationTypes, {
        checked: true
      }), function(type) {
        return type.type;
      });
    });
  };
})

.factory('CooperativeActionTypePopup', function($ionicPopup, $translate) {
  return function($scope) {
    _.each($scope.actionTypes, function(type) {
      type.selected = false;
    });
    _.each($scope.action.types, function(id) {
      $scope.actionTypes.getById(id).selected = true;
    });
    $ionicPopup.show({
      templateUrl: 'app/cooperative/actionTypes.html',
      scope: $scope,
      title: $translate.instant('COOPERATIVE_ACTION_TYPE'),
      cssClass: 'popup-flexible',
      buttons: [{
        text: $translate.instant('Cancel')
      }, {
        text: 'OK',
        type: 'button-positive',
        onTap: function() {
          // Disable subactions if parent not selected
          _.each($scope.actionTypes, function(type) {
            if (type.parent && !$scope.actionTypes.getById(type.parent).selected) {
              type.selected = false;
            }
          });
            // Assign selected types to action
          $scope.action.types = _.map(_.where($scope.actionTypes, {
            selected: true
          }), function(type) {
            return type.id;
          });
        }
      }]
    });
  };
})

.controller('CooperativeActionAddCtrl', function($scope, $state, CooperativeActionTypePopup, Cooperatives, currentUser) {
  $scope.action = {};

  $scope.actionTypes = Cooperatives.getActionTypes();

  $scope.selectActionType = function() {
    CooperativeActionTypePopup($scope);
  };

  $scope.addAction = function() {
    Cooperatives.addAction({
      id: currentUser.cooperativeId
    }, $scope.action, function() {
      $state.go('^');
      mixpanel.track('Cooperative Action added', $scope.action);
    });
  };
})

.controller('CooperativeActionUpdateCtrl', function($scope, $state, $stateParams, CooperativeActionTypePopup, Cooperatives, currentUser) {

  $scope.actionTypes = Cooperatives.getActionTypes();

  $scope.selectActionType = function() {
    CooperativeActionTypePopup($scope);
  };

  Cooperatives.get({
    id: currentUser.cooperativeId
  }, function(data) {
    $scope.action = _.findWhere(data.actions, {
      _id: $stateParams.id
    });
    $scope.action.date = new Date($scope.action.date);
  });

  $scope.deleteAction = function(action) {
    Cooperatives.deleteAction({
      id: currentUser.cooperativeId,
      actionId: action._id
    }, function() {
      $state.go('^');
      mixpanel.track('Cooperative Action deleted', {
        id: action._id,
        name: action.name
      });
    });
  };

  $scope.updateAction = function() {
    Cooperatives.updateAction({
      id: currentUser.cooperativeId,
      actionId: $scope.action._id
    }, $scope.action, function() {
      $state.go('^');
      mixpanel.track('Cooperative Action updated', {
        id: $scope.action._id,
        name: $scope.action.name
      });
    });
  };
})

.factory('CooperativesFilterPopup', function($ionicPopup, $translate, $state) {
  return function($scope, cooperatives) {
    _.each($scope.actionTypes, function(type) {
      type.checked = false;
    });
    _.each($scope.actionTypesSelected, function(id) {
      $scope.actionTypes.getById(id).checked = true;
    });

    $scope.showActions = $scope.actionTypesSelected.length > 0;
    $scope.showVentilationTypes = $scope.ventilationTypesSelected.length > 0;

    var filterPopUp = $ionicPopup.show({
      scope: $scope,
      title: $translate.instant('COOPERATIVE_FILTER'),
      templateUrl: 'app/cooperative/filterPopUp.html',
      cssClass: 'popup-custom',
      buttons: [{
        text: 'DESELECT',
        type: 'button-clear popup-button',
        onTap: function(e) {
          _.each($scope.ventilationTypes, function(ventilationType) {
            ventilationType.checked = false;
          });
          _.each($scope.actionTypes, function(type) {
            type.checked = false;
          });
          // Assign selected types to action
          //$scope.action.types = _.map(_.where($scope.actionTypes,{selected:true}),function(type){return type.id});
          e.preventDefault();
        }
      }, {
        text: 'OK',
        type: 'button-clear popup-button'
      }]
    });
    filterPopUp.then(function() {
      $scope.cooperativesList = cooperatives;
      _.each($scope.actionTypes, function(type) {
        if (type.parent && !$scope.actionTypes.getById(type.parent).checked) {
          type.checked = false;
        }
      });
      // Assign selected types
      $scope.actionTypesSelected = _.map(_.where($scope.actionTypes, {
        checked: true
      }), function(type) {
        return type.id;
      });
      $scope.ventilationTypesSelected = _.map(_.where($scope.ventilationTypes, {
        checked: true
      }), function(type) {
        return type.type;
      });
      if ($scope.ventilationTypesSelected.length > 0) {
        $scope.cooperativesList = _.filter($scope.cooperativesList, function(cooperative) {
          return _.intersection(cooperative.ventilationType, $scope.ventilationTypesSelected).length > 0;
        });
      }
      //TO DO: Improve performace
      if ($scope.actionTypesSelected.length > 0) {
        //get each cooperatives from the list with their actions types list
        var listedCooperativesWithActions = [];
        _.each($scope.cooperativesList, function(cooperative) {
          _.each(cooperative.actions, function(action) {
            var element = {};
            element.coopId = cooperative._id;
            element.actions = action.types;
            listedCooperativesWithActions.push(element);
          });
        });
        //get the cooperatives that have the at least one of the selected actions
        var CooperativesIdsWithSelectedActions = [];
        _.each(listedCooperativesWithActions, function(obj) {
          _.each(obj.actions, function(obj2) {
            if (_.contains($scope.actionTypesSelected, obj2)) {
              if (CooperativesIdsWithSelectedActions.indexOf(obj.coopId) == -1) {
                CooperativesIdsWithSelectedActions.push(obj.coopId);
              }
            }
          });
        });
        //filter list
        $scope.cooperativesList = _.filter($scope.cooperativesList, function(cooperative) {
          return _.contains(CooperativesIdsWithSelectedActions, cooperative._id);
        });
      }
      if ($scope.ventilationTypesSelected.length > 0 || $scope.actionTypesSelected.length > 0) {
        $state.go($state.current, {}, {
          reload: true
        });
      }
    });
  };
})

.controller('CooperativesCtrl', function(User, $scope, $state, Cooperatives, cooperatives, cooperativeSelection, CooperativesFilterPopup, $ionicPopup, $translate) {
  $scope.cooperativesList = cooperatives;
  $scope.cooperatives = cooperatives;
  User.get().$promise.then(function(user) {
    Cooperatives.get({
      id: user.cooperativeId
    }, function(data) {
      $scope.myCooperative = data;
    });

    $scope.cooperativesList = _.reject($scope.cooperativesList, function(coop) {
      return coop._id === user.cooperativeId;
    });
  }, function() {
    $scope.myCooperative = '';
  });

  //filter criterias
  $scope.ventilationTypes = _.map(Cooperatives.VentilationTypes, function(type) {
    return {
      type: type,
      checked: false
    };
  });
  $scope.actionTypes = Cooperatives.getActionTypes();
  $scope.ventilationTypesSelected = {};
  $scope.actionTypesSelected = {};

  //cooperative selected for comparison
  $scope.selection = {
    cooperative: {}
  };

  $scope.view = 'map';

  $scope.$on('$ionicView.enter', function() {
    Cooperatives.query(function(data) {
      $scope.cooperatives = data;
    });
    //by default, no cooperative is selected
    cooperativeSelection.setSelection('');
  });

  $scope.cooperativeClick = function(id) {
    $state.go('^.show', {
      id: id
    });
  };

  $scope.compareToSelectedCooperative = function() {
    cooperativeSelection.setSelection($scope.selection);
    $state.go('^.show', {
      id: currentUser.cooperativeId
    });
  };

  $scope.isCooperativeSelected = function() {
    return !_.isEmpty($scope.selection.cooperative);
  };

  //Lists the possible filter criterias in a pop-up
  $scope.filterList = function() {
    CooperativesFilterPopup($scope, cooperatives);
  };

  $scope.energyPerformanceInfo = function() {
    $ionicPopup.show({
      title: $translate.instant('COOPERATIVE_PERFORMANCE'),
      template: $translate.instant('COOPERATIVE_ENERGY_PERFORMANCE_DESCRIPTION'),
      cssClass: 'popup-custom',
      buttons: [{
        text: 'OK',
        type: 'button-clear popup-button'
      }]
    });
  };
})

.directive('ionRadioCustom', function() {
  return {
    restrict: 'E',
    replace: true,
    require: '?ngModel',
    transclude: true,
    template: '<label class="item item-radio radio-custom">' +
      '<input type="radio" name="radio-group">' +
      '<div class="item-content disable-pointer-events hidden-content"></div>' +
      '<i class="radio-icon-unchecked disable-pointer-events icon ion-checkmark-unchecked"></i>' +
      '<i class="radio-icon-checked disable-pointer-events icon ion-checkmark-checked"></i>' +
      '</label>',
    compile: function(element, attr) {
      if (attr.checkedicon) {
        element.children().eq(3).removeClass('ion-checkmark-checked').addClass(attr.checkedicon);
      }
      if (attr.uncheckedicon) {
        element.children().eq(2).removeClass('ion-checkmark-unchecked').addClass(attr.uncheckedicon);
      }
      var input = element.find('input');
      _.each({
        'name': attr.name,
        'value': attr.value,
        'disabled': attr.disabled,
        'ng-value': attr.ngValue,
        'ng-model': attr.ngModel,
        'ng-disabled': attr.ngDisabled,
        'ng-change': attr.ngChange,
        'ng-required': attr.ngRequired,
        'required': attr.required
      }, function(value, name) {
        input.attr(name, value);
      });

      return function(scope, element, attr) {
        scope.getValue = function() {
          return scope.ngValue || attr.value;
        };
      };
    }
  };
})

.controller('CooperativesMapCtrl', function(User, $q, $scope, $compile, $ionicLoading, $translate, AuthService, GeoIP) {

  function initialize() {
    var getLatLng, myCoop;

    if ($scope.currentUser) {
      myCoop = _.findWhere($scope.cooperatives,{_id:$scope.currentUser.cooperativeId});
      getLatLng = $q.resolve(new google.maps.LatLng(myCoop.lat, myCoop.lng));
    } else {
      getLatLng = GeoIP.getLatLng().then(function (latlng) {
        return new google.maps.LatLng(latlng[0], latlng[1]);
      });
    }

    getLatLng.then(function (myLatLng) {
      var mapOptions = {
        mapTypeControl: false,
        streetViewControl: false,
        center: myLatLng,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      var map = new google.maps.Map(document.getElementById('map'), mapOptions);

      var energyClasses = {
        A: '009036',
        B: '55AB26',
        C: 'C8D200',
        D: 'FFED00',
        E: 'FBBA00',
        F: 'EB6909',
        G: 'E2001A',
        unknown: 'bbbbbb'
      };

      var energyClassPins = _.mapObject(energyClasses, function(value) {
        return new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + value,
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34));
      });

      var markers = [];
      var bounds = new google.maps.LatLngBounds();
      var infowindow = new google.maps.InfoWindow();

      angular.forEach($scope.cooperatives, function(coop) {
        //Marker + infowindow + angularjs compiled ng-click
        var contentString = '<div ng-click="cooperativeClick(\'' +
          coop._id + '\')"><h5>' +
          coop.name + '</h5>' +
          '{{' + coop.performance + ' | number:0}}' + ' kWh/m2 <br><p>' +
          $translate.instant('COOPERATIVE_ENERGY_ACTIONS') + ': <b class="energized">' +
          coop.actions.length + '</b></p></div>';
        var compiled = $compile(contentString)($scope);

        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(coop.lat, coop.lng),
          map: map,
          title: coop.name,
          icon: energyClassPins[coop.getEnergyClass()] || energyClassPins['unknown']
        });

        markers.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(compiled[0]);
          infowindow.open(map, marker);
        });
      });

      _.chain(markers)
        .sort(function (a, b) {
          var aDistance = getPositionDistance(myLatLng, a.getPosition());
          var bDistance = getPositionDistance(myLatLng, b.getPosition());

          return aDistance > bDistance ? 1 : -1;
        })
        .first(5)
        .forEach(function (marker) { bounds.extend(marker.getPosition()); });

      map.fitBounds(bounds);

      $scope.map = map;
    });
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function getPositionDistance(posA, posB) {
    var lon1 = posA.lng();
    var lat1 = posA.lat();
    var lon2 = posB.lng();
    var lat2 = posB.lat();

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad above
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km

    return d;
  }

  AuthService.isAuthenticated().then(function (isAuthenticated) {
    if (isAuthenticated) {
      User.get().$promise.then(function (user) {
        $scope.currentUser = user;
        initialize();
      }, initialize);
    } else {
      ionic.Platform.ready(initialize);
    }
  });

  $scope.centerOnMe = function() {
    if (!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });

    navigator.geolocation.getCurrentPosition(function(pos) {
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      $scope.loading.hide();
    }, function(error) {
      // eslint-disable-next-line no-alert
      alert('Unable to get location: ' + error.message);
    });
  };

  $scope.clickTest = function() {
    // eslint-disable-next-line no-alert
    alert('Example of infowindow with ng-click');
  };

})

.service('cooperativeSelection', function() {
  var selection = '';
  return {
    getSelection: function() {
      return selection;
    },
    setSelection: function(value) {
      selection = value;

    }
  };
});
