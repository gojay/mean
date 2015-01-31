'use strict';

describe('Controller: CloudinaryUploadCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var CloudinaryUploadCtrl, $rootScope, $scope, deferredResources, deferredUpload, CloudinaryService;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$rootScope_, $q, _CloudinaryService_, $templateCache) {
    $templateCache.put('app/main/main.html', '');

    $rootScope = _$rootScope_;

    $rootScope.tag = 'example';
    $rootScope.promiseResources = null;
    $rootScope.setActiveTab = jasmine.createSpy();
    $rootScope.getResources = jasmine.createSpy().andCallFake(function() {
      deferredResources = $q.defer();
      return deferredResources.promise;
    });

    $scope = $rootScope.$new();
    CloudinaryService = _CloudinaryService_;
    CloudinaryService.upload.resources = jasmine.createSpy().andCallFake(function(files, options, cb) {
      return cb(files).then(function() {
        deferredUpload = $q.defer();
        return deferredUpload.promise;
      });
    });
    CloudinaryUploadCtrl = $controller('CloudinaryUploadCtrl', {
      $scope: $scope,
      CloudinaryService: CloudinaryService
    });

  }));

  it('should all $scope.$parent to be defined', function () {
    expect($scope.$parent.tag).toBeDefined();
    expect($scope.$parent.promiseResources).toBeDefined();
    expect($scope.$parent.setActiveTab).toBeDefined();
    expect($scope.$parent.setActiveTab).toEqual(jasmine.any(Function));
    expect($scope.$parent.getResources).toBeDefined();
    expect($scope.$parent.getResources).toEqual(jasmine.any(Function));
  });

  it('should $scope.files to be defined', function () {
    expect($scope.files).toBeDefined();
  });

  describe('upload', function() {
    var images = [{ 'name': 'file1' }, { 'name': 'file2' }];
    beforeEach(function() {
      spyOn($scope, 'callbackReadFiles').andCallThrough();
      $scope.files.images = images;
      $scope.$apply();
    });

    it('should CloudinaryService.upload to have been called', function() {
      expect(CloudinaryService.upload.resources).toHaveBeenCalledWith(images, { tag: $scope.$parent.tag }, jasmine.any(Function));
    });

    it('should callbackReadFiles to have been called', function() {
      // resolve get cloudinary resources
      deferredResources.resolve([{ 'public_id': 'file3' }, { 'public_id': 'file4' }]);
      $rootScope.$apply();

      expect($scope.callbackReadFiles).toHaveBeenCalled();
      expect(CloudinaryService.resources.data[0]).toEqual(images[0]);
      expect(CloudinaryService.resources.data[1]).toEqual(images[1]);
      expect(CloudinaryService.resources.data.length).toBe(4);
    });

    it('should will be removed resources data by deferred.notify, after upload resolved', function() {
      deferredResources.resolve([{ 'public_id': 'file3' }, { 'public_id': 'file4' }]);
      $rootScope.$apply();

      deferredUpload.notify({ file:{ 'public_id': 'file1' }, index: 0 });

      deferredUpload.resolve();
      $rootScope.$digest();

      expect(CloudinaryService.resources.data.length).toBe(3);
      expect(_.pluck(CloudinaryService.resources.data, 'public_id')).toEqual(['file2', 'file3', 'file4']);
    });

  });
});
