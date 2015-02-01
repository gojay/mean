'use strict';

describe('Controller: CloudinaryUploadCtrl', function () {

  // load the controller's module
  beforeEach(module('exampleAppApp'));

  var $rootScope, $scope, deferredUpload, deferredPopulate, CloudinaryService;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, _$rootScope_, $q, _CloudinaryService_, $templateCache) {
    $templateCache.put('app/main/main.html', '');

    $rootScope = _$rootScope_;

    $rootScope.tag = 'example';
    $rootScope.setActiveTab = jasmine.createSpy();

    $scope = $rootScope.$new();
    CloudinaryService = _CloudinaryService_;
    // mock cloudinary.upload.resources
    CloudinaryService.upload.resources = jasmine.createSpy().and.callFake(function(files, options, cb) {
      return cb(files).then(function() {
        deferredUpload = $q.defer();
        return deferredUpload.promise;
      });
    });
    // mock cloudinary.resources.populate
    CloudinaryService.resources.populate = jasmine.createSpy().and.callFake(function() {
      deferredPopulate = $q.defer();
      return deferredPopulate.promise;
    });
    
    $controller('CloudinaryUploadCtrl', {
      $scope: $scope,
      CloudinaryService: CloudinaryService
    });

  }));

  it('should all $scope.$parent to be defined', function () {
    expect($scope.$parent.tag).toBeDefined();
    expect($scope.$parent.setActiveTab).toEqual(jasmine.any(Function));
  });

  it('should $scope.files to be defined', function () {
    expect($scope.files).toBeDefined();
  });

  describe('upload files', function() {
    var images = [{ 'name': 'file1' }, { 'name': 'file2' }];
    beforeEach(function() {
      spyOn($scope, 'callbackReadFiles').and.callThrough();
      $scope.files.images = images;
      $scope.$apply();
    });

    it('should CloudinaryService.upload to have been called', function() {
      expect(CloudinaryService.upload.resources).toHaveBeenCalledWith(images, { tag: $scope.$parent.tag }, jasmine.any(Function));
    });

    it('should callbackReadFiles to have been called', function() {
      // resolve get cloudinary resources
      deferredPopulate.resolve([{ 'public_id': 'file3' }, { 'public_id': 'file4' }]);
      $rootScope.$apply();

      expect($scope.callbackReadFiles).toHaveBeenCalledWith(images);
      expect(CloudinaryService.resources.data[0].public_id).toEqual(images[0].name);
      expect(CloudinaryService.resources.data[0].selected).toBeDefined();
      expect(CloudinaryService.resources.data[0].focus).toBeDefined();
      expect(CloudinaryService.resources.data[0].hover).toBeDefined();

      expect(CloudinaryService.resources.data[1].public_id).toEqual(images[1].name);
      expect(CloudinaryService.resources.data[1].selected).toBeDefined();
      expect(CloudinaryService.resources.data[1].focus).toBeDefined();
      expect(CloudinaryService.resources.data[1].hover).toBeDefined();
      expect(CloudinaryService.resources.data.length).toBe(4);
    });

    it('should will be removed resources data by deferred.notify, after upload resolved', function() {
      deferredPopulate.resolve([{ 'public_id': 'file3' }, { 'public_id': 'file4' }]);
      $rootScope.$apply();

      deferredUpload.notify({ file:{ 'public_id': 'file1' }, index: 0 });

      deferredUpload.resolve();
      $rootScope.$digest();

      expect(CloudinaryService.resources.data.length).toBe(3);
      expect(_.pluck(CloudinaryService.resources.data, 'public_id')).toEqual(['file2', 'file3', 'file4']);
    });

  });
});
