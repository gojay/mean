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
    spyOn(CloudinaryService.api, 'query').andCallFake(function(params) {
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

  describe('$scope.tabs', function() {
    it('should $scope.tabs is defined & have 3 tabs', function() {
      expect($scope.tabs).toBeDefined();
      expect(_.size($scope.tabs)).toEqual(3);
    });

    it('should tab cloudinary is default', function() {
      var activeTab = _.find($scope.tabs, 'active');
      expect(activeTab.state).toEqual('cloudinary');
    });

    describe('setActiveTab()', function() {
      beforeEach(function() {
        spyOn($state, 'go').andCallFake(angular.noop);
        spyOn($scope, 'getImages').andReturn(null);
      });

      it('set 1: tab resources is actived & getImages() called', function() {
        $scope.setActiveTab(1);
        var activeTab = _.find($scope.tabs, 'active');
        expect($state.go).toHaveBeenCalledWith('cloudinary.resources');
        expect($scope.getImages).toHaveBeenCalled();
      });

      it('set 2: tab url is actived & getImages() not called', function() {
        $scope.setActiveTab(2);
        var activeTab = _.find($scope.tabs, 'active');
        expect($state.go).toHaveBeenCalledWith('cloudinary.url');
        expect($scope.getImages).not.toHaveBeenCalled();
      });
    });
  });

  describe('$scope.resources', function() {
    it('should data is array & empty', function() {
      expect($scope.resources.data).toEqual(jasmine.any(Array));
      expect($scope.resources.data.length).toEqual(0);
    });

    describe('data', function() {
      beforeEach(function() {
        $scope.resources.data = CloudinaryService.dummy();
      });

      it('should data lenght greater than 0', function() {
        expect($scope.resources.data.length).toBeGreaterThan(0);
      });

      describe('trigger:select,focus,clear', function() {
        var item;
        beforeEach(function() {
          item = $scope.resources.data[5];
          $scope.resources.setSelected(item);
          $scope.resources.setFocus(item);
        });

        it('should item is selected n focus', function() {
          expect(item.selected).toBeTruthy();
          expect(item.focus).toBeTruthy();
        });

        it('should to be resource detail selected', function() {
          expect($scope.resources.selected.detail).toBe(item);
        });

        it('should get classname', function() {
          var className = $scope.resources.getClassName(item);
          expect(className).toEqual('status-selected status-focus');
        });

        describe('clear()', function() {
          beforeEach(function() {
            $scope.resources.clear();
          });

          it('should resource detail to be null', function() {
            expect($scope.resources.selected.detail).toBeNull();
          });

          it('should all resources data unselected & unfocus', function() {
            expect(_.some($scope.resources.data, 'selected')).toBeFalsy();
            expect(_.some($scope.resources.data, 'focus')).toBeFalsy();
          });
        });
      });

      describe('selected', function() {
        var item1, item2;
        beforeEach(function() {
          expect($scope.resources.selected.detail).toBeNull();
          expect($scope.resources.selected.data.length).toEqual(0);

          item1 = $scope.resources.data[5];
          item2 = $scope.resources.data[10];
          $scope.resources.selected.add(item1);
          $scope.resources.selected.add(item2);
        });

        it('should have 2 selected data', function() {
          expect($scope.resources.selected.data.length).toBe(2);
        })

        it('should set active', function() {
          $scope.resources.selected.setActive(1);
          expect($scope.resources.selected.data[1].active).toBeTruthy();
        });

        it('should set single data', function() {
          $scope.resources.selected.set(['item']);
          expect($scope.resources.selected.data.length).toBe(1);
        });

        it('should have 1 selected data, when unset', function() {
          $scope.resources.selected.setActive(1);
          $scope.resources.selected.unset(item2);
          expect(_.indexOf($scope.resources.selected.data, item2)).toEqual(-1);
          expect($scope.resources.selected.data.length).toBe(1);
        });

        it('should last selected data is selected, when force unset', function() {
          $scope.resources.selected.setActive(1);
          $scope.resources.selected.unset(item2, true);
          expect(item1.selected).toBeTruthy();
        });
      });
    })
  });

  describe('getResources()', function() {
    it('should get dummy resources', inject(function($timeout) {
      $scope.getResources(true).then(function(data) {
        expect(data).toBeDefined();
      });
      $timeout.flush();
    }));
    it('should get service resources', inject(function($timeout) {
      $scope.getResources().then(function(data) {
        expect(data).toBeDefined();
      });
      
      deferredQuery.resolve([]);
      $rootScope.$digest();

      expect(CloudinaryService.api.query).toHaveBeenCalledWith({tags:true});
    }));
  });

  describe('getImages()', function() {
    it('should get resources data form images dummy', inject(function($timeout) {
      $scope.getImages(true);
      expect($scope.resources.data.length).toEqual(0);
      $timeout.flush();
      expect($scope.resources.data.length).toBeGreaterThan(0);
    }));
    it('should get resources data form cloudinary', inject(function($timeout) {
      $scope.getImages();
      expect($scope.resources.data.length).toEqual(0);
      
      deferredQuery.resolve({ resources: [{'public_id': 'image1', tags:['example'], bytes: 1024}] });
      $rootScope.$digest();

      expect($scope.resources.data.length).toBeGreaterThan(0);

      expect(CloudinaryService.api.query).toHaveBeenCalledWith({tags:true});
    }));
  });
});
