'use strict';

describe('Service: CloudinaryService', function () {
  // load the service's module
  beforeEach(module('exampleAppApp'));

  var $rootScope, CloudinaryService;

  // instantiate service
  beforeEach(inject(function ($templateCache, _$rootScope_, _CloudinaryService_) {
    $templateCache.put('app/main/main.html', '');
    $rootScope = _$rootScope_;
    CloudinaryService = _CloudinaryService_;
  }));

  // CloudinaryService.dummy()
  it('dummy()', function() {
    var data = CloudinaryService.dummy(15);
    expect(data.length).toEqual(15);
  });

  // CloudinaryService.api[method]
  describe('api', function() {
    var $httpBackend;
    beforeEach(inject(function(_$httpBackend_) {
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET('/api/cloudinary').respond({resources:[]});
    }));

    it('should query', function() {
      CloudinaryService.api.query().$promise.then(function(data) {
        expect(data).toBeDefined();
        expect(data).toEqual(jasmine.any(Object));
      });
      $httpBackend.flush();
    });
  });

  // CloudinaryService.upload[method]
  describe('upload', function() {
    var files = [{name:'file1'}, {name:'file2'}];
    var deferredPrepare, callbackReadFiles;
    beforeEach(inject(function($q) {
      callbackReadFiles = jasmine.createSpy().andCallFake(function(params) {
        var deferred = $q.defer();
        deferred.resolve(params);
        return deferred.promise;
      });

      deferredPrepare = $q.defer();
      spyOn(CloudinaryService.upload, 'prepare').andReturn(deferredPrepare.promise);
      spyOn(CloudinaryService.upload, 'uploadCloudinary').andCallFake(function(file) {
        var deferred = $q.defer();
        deferred.resolve({ public_id: '1234' });
        return deferred.promise;
      });
    }));

    it('should files uploaded', function () {
      CloudinaryService.upload.resources(files, {}, callbackReadFiles)
        .then(function(){ 
          expect(files.length).toEqual(2);
          expect(files[0]['public_id']).toEqual('1234');
          expect(files[0].status.code).toBe(3);
          expect(files[0].status.message).toBe('Uploaded');
          expect(files[1]['public_id']).toEqual('1234');
          expect(files[1].status.code).toBe(3);
          expect(files[1].status.message).toBe('Uploaded');
        });


      deferredPrepare.resolve(files);
      $rootScope.$apply();
    });
  });

});
