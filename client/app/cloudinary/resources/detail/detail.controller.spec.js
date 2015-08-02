'use strict';

describe('Controller: CloudinaryResourcesDetailCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryResourcesDetailCtrl, $scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $templateCache) {
    $templateCache.put('app/main/main.html', '');

    spyOn($rootScope, '$broadcast').and.callThrough();

    $scope = $rootScope.$new();
    CloudinaryResourcesDetailCtrl = $controller('CloudinaryResourcesDetailCtrl', {
      $scope: $scope
    });

    spyOn($scope.sizes, 'init').and.callThrough();
    spyOn($scope.sizes, 'get').and.callThrough();
    spyOn($scope.sizes, 'set').and.callThrough();
    spyOn($scope.sizes, 'calc').and.callThrough();
    spyOn($scope.sizes, 'convert').and.callThrough();

  }));

  describe('event', function(){
    beforeEach(function(){
      $scope.$broadcast('resource:onselected:detail', { width: 1024, height: 768 });
      $scope.$digest();
    });

    it('should sizes init to have been called, when listen event "resource:onselected:detail"', function () {
      expect($scope.sizes.init).toHaveBeenCalled();
    });

    describe('dispatch to parent ($emit) "resource:onchange:size"', function(){
      beforeEach(function(){
        spyOn($scope, '$emit').and.callThrough();
      });

      it('should default to send index 3', function(){
        expect($scope.sizes.selected.name).toMatch(/^original/i);
        // expect($scope.$emit).toHaveBeenCalledWith('resource:onchange:size', jasmine.objectContaining({ index: 3 }));
      });

      it('should not to have been called, when the custom option is selected for the first time', function(){
        $scope.sizes.selected = $scope.sizes.options[2];
        expect($scope.sizes.selected.size).not.toBeDefined();
        $scope.$digest();
        expect($scope.$emit).not.toHaveBeenCalled();
      });

      it('should $emit, when change/select the sizes option', function(){
        $scope.sizes.selected = $scope.sizes.options[2];
        $scope.sizes.custom.width = 500;
        $scope.sizes.calc();
        $scope.$digest();
        expect($scope.$emit).toHaveBeenCalledWith('resource:onchange:size', jasmine.objectContaining({ index: 2 }));
      });
    });
  });

  it('should edit is true and dispatch "resource:request" when get resources', function(){
    $scope.getResource();
    expect($scope.$parent.$broadcast).toHaveBeenCalledWith('resource:request');
  });
});
