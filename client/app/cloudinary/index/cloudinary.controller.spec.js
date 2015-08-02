'use strict';

describe('Controller: CloudinaryCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryCtrl, CloudinaryService, deferredQuery, $scope, $state, $modalInstance;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $q, _$state_, _CloudinaryService_, $templateCache) {
    spyOn($rootScope, '$broadcast').and.callThrough();
    $scope = $rootScope.$new();

    $state = _$state_;
    CloudinaryService = _CloudinaryService_;
    spyOn(CloudinaryService.resources, 'url').and.callFake(angular.noop);

    $modalInstance = jasmine.createSpyObj('$modalInstance', ['close']);

    CloudinaryCtrl = $controller('CloudinaryCtrl', {
      $scope: $scope,
      $state: $state,
      $modalInstance: $modalInstance,
      CloudinaryService: CloudinaryService
    });

    $templateCache.put('app/main/main.html', '');
  }));

  // tabs
  describe('$scope.tabs', function() {
    it('should $scope.tabs is defined & have 3 of  tabs', function() {
      expect($scope.tabs).toBeDefined();
      expect(_.size($scope.tabs)).toEqual(3);
    });

    it('should $state cloudinary.upload is default tab', function() {
      var activeTab = _.find($scope.tabs, 'active');
      expect(activeTab.state).toEqual('cloudinary.upload');
    });

    describe('setActiveTab()', function() {
      beforeEach(function() {
        // mocking $state.go
        spyOn($state, 'go').and.callFake(angular.noop);
        // mocking cloudinary service resources populate
        spyOn(CloudinaryService.resources, 'populate').and.callFake(angular.noop);
      });

      it('should go to cloudinary.resources & populate Cloudinary to have been called, when tab 1 activated', function() {
        $scope.setActiveTab(1);
        expect($state.go).toHaveBeenCalledWith('cloudinary.resources');
        expect(CloudinaryService.resources.populate).toHaveBeenCalled();
      });

      it('should go to cloudinary.resources & populate Cloudinary not to have been called, when tab 1 activated & set false on parameter "requestRequired"', function() {
        $scope.setActiveTab(1, false);
        expect($state.go).toHaveBeenCalledWith('cloudinary.resources');
        expect(CloudinaryService.resources.populate).not.toHaveBeenCalled();
      });

      it('should go to cloudinary.url & populate Cloudinary not to have been called, when tab 2  activated', function() {
        $scope.setActiveTab(2);
        expect($state.go).toHaveBeenCalledWith('cloudinary.url');
        expect(CloudinaryService.resources.populate).not.toHaveBeenCalled();
      });
    });
  });

  // events
  describe('Events', function() {

    it('should $broadcast "resource:onselected:detail", when there are the items who focused & $viewContentLoaded', inject(function($timeout){
      spyOn(CloudinaryService.resources, 'getFocus').and.returnValue('item');
      $rootScope.$broadcast('$viewContentLoaded');
      $scope.$digest();
      expect($scope.$broadcast).toHaveBeenCalledWith('resource:onselected:detail', 'item');
    }));

    it('should $broadcast "resource:onselected:detail", when $watch resources.getDetail()', function(){
      var detailResource = {
        "public_id": "sample",
        "format": "jpg",
        "width": 800,
        "height": 600
      };
      spyOn(CloudinaryService.resources, 'getFocus').and.returnValue(detailResource);
      $scope.$digest();
      expect($scope.$broadcast).toHaveBeenCalledWith('resource:onselected:detail', detailResource);
    });

    it('should selectedImages length to be greater than 0, when listen event "resource:onchange:size"', function(){
      $rootScope.$broadcast('resource:onchange:size', 'data');
      expect(CloudinaryService.resources.url).toHaveBeenCalled();
    });

    it('should $broadcast "cloudinary:onselected:image" when close modal', function(){
      spyOn($scope.resources, 'getSelected').and.returnValue(['item1', 'item2']);
      $scope.close();
      expect($scope.resources.getSelected).toHaveBeenCalled();
      expect($rootScope.$broadcast).toHaveBeenCalledWith('cloudinary:onselected:image', jasmine.any(Array));
      expect($modalInstance.close).toHaveBeenCalled();
    });
  });

  // delete modal
  xdescribe('Delete: modal >', function() {
    var deferred, $modal, fakeModal = {
      result: {
          then: function(confirmCallback, cancelCallback) {
              this.confirmCallback = confirmCallback;
              this.cancelCallback = cancelCallback;
          }
      },
      close: function(item) {
          this.result.confirmCallback(item);
      },
      dismiss: function(type) {
          this.result.cancelCallback(type);
      }
    };

    beforeEach(inject(function($q, $templateCache, _$modal_) {
      // mock cloudinary service api remove
      CloudinaryService.api.remove = jasmine.createSpy().and.callFake(function() {
        deferred = $q.defer();
        return { $promise: deferred.promise };
      });
      // mock $modal
      $modal = _$modal_;
      spyOn($modal, 'open').and.returnValue(fakeModal);

      $templateCache.put('app/main/main.html', '');
    }));

    describe('multiple items', function() {
      var instance;
      beforeEach(function() {
        var items = getItemByIndex([1,2,3]);
        instance = $scope.delete('selected items', items);
        expect($modal.open).toHaveBeenCalled();
      });

      it('should items not removed, when choose "cancel" on modal', function() {
        // choose 'cancel', only close the modal
        instance.dismiss();
        expect($loading.start).not.toHaveBeenCalled();
        expect(CloudinaryService.api.remove).not.toHaveBeenCalled();
        expect(CloudinaryService.resources.data.length).toBe(10);
      });

      it('should items removed, when choose "delete/ok" on modal', function(){
        // choose 'ok', close the modal and call the callback
        instance.close();

        expect($loading.start).toHaveBeenCalled();
        expect(CloudinaryService.api.remove).toHaveBeenCalledWith({ id: 'image-1|image-2|image-3' });

        // cloudinary api remove resolved
        deferred.resolve();
        $rootScope.$apply();

        expect(CloudinaryService.resources.data.length).toBe(7);
        expect(getSelected().length).toBe(0);
        expect(getSelected('detail')).toBeNull();
        expect($loading.stop).toHaveBeenCalled();
      });
    });
  });
});
