'use strict';

describe('Controller: CloudinaryCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryCtrl, CloudinaryService, deferredQuery, $scope, $state;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $q, _$state_, _CloudinaryService_, $templateCache) {
    $scope = $rootScope.$new();

    $state = _$state_;
    CloudinaryService = _CloudinaryService_;
    // mockine cloudinary service api
    spyOn(CloudinaryService.api, 'query').and.callFake(function(params) {
      deferredQuery = $q.defer();
      return { $promise: deferredQuery.promise };
    });

    CloudinaryCtrl = $controller('CloudinaryCtrl', {
      $scope: $scope,
      $state: $state,
      CloudinaryService: CloudinaryService
    });
    $templateCache.put('app/main/main.html', '');
  }));

  // tabs
  describe('$scope.tabs', function() {
    it('should $scope.tabs is defined & have 3 tabs', function() {
      expect($scope.tabs).toBeDefined();
      expect(_.size($scope.tabs)).toEqual(3);
    });

    it('should default tab is cloudinary', function() {
      var activeTab = _.find($scope.tabs, 'active');
      expect(activeTab.state).toEqual('cloudinary');
    });

    describe('setActiveTab()', function() {
      beforeEach(function() {
        spyOn($state, 'go').and.callFake(angular.noop);
        spyOn($scope, 'getResources').and.returnValue(null);
      });

      it('should go to cloudinary.resources & getResources() to have been called, when tab 1 activated', function() {
        $scope.setActiveTab(1);
        var activeTab = _.find($scope.tabs, 'active');
        expect($state.go).toHaveBeenCalledWith('cloudinary.resources');
        expect($scope.getResources).toHaveBeenCalled();
      });

      it('should go to cloudinary.resources & getResources() not to have been called, when tab 1 activated & set false on parameter "requestRequired"', function() {
        $scope.setActiveTab(1, false);
        var activeTab = _.find($scope.tabs, 'active');
        expect($state.go).toHaveBeenCalledWith('cloudinary.resources');
        expect($scope.getResources).not.toHaveBeenCalled();
      });

      it('should go to cloudinary.url & getResources() not to have been called, when tab 2  activated', function() {
        $scope.setActiveTab(2);
        var activeTab = _.find($scope.tabs, 'active');
        expect($state.go).toHaveBeenCalledWith('cloudinary.url');
        expect($scope.getResources).not.toHaveBeenCalled();
      });
    });
  });

  // get resources
  describe('getResources()', function() {
    xit('should get resources data form images dummy', inject(function($timeout) {
      $scope.getResources(true);
      expect($scope.resources.data.length).toEqual(0);
      $timeout.flush();
      expect($scope.resources.data.length).toBeGreaterThan(0);
    }));
    it('should get resources data form cloudinary', inject(function($timeout) {
      $scope.getResources();
      expect($scope.resources.data.length).toEqual(0);
      
      deferredQuery.resolve({ resources: [{'public_id': 'image1', tags:['example'], bytes: 1024}] });
      $rootScope.$digest();

      expect($scope.resources.data.length).toBeGreaterThan(0);

      expect(CloudinaryService.api.query).toHaveBeenCalledWith({tags:true});
    }));
  });
});
