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

  // CloudinaryService.dummy
  it('dummy', function() {
    var data = CloudinaryService.dummy(15);
    expect(data.length).toEqual(15);
  });

  // CloudinaryService.api
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

  // CloudinaryService.upload
  describe('.upload', function() {
    var files = [{name:'file1'}, {name:'file2'}];
    var deferredPrepare, callbackReadFiles, $httpBackend, $upload;

    beforeEach(inject(function($q, _$httpBackend_, _$upload_) {

      callbackReadFiles = jasmine.createSpy().and.callFake(function(params) {
        var deferred = $q.defer();
        deferred.resolve(params);
        return deferred.promise;
      });

      // mock FileReader
      window.FileReader = jasmine.createSpy().and.returnValue({
        addEventListener: function(event, cb) {
          var e = { target: { result: 'data:image/jpeg' }};
          cb(e);
        },
        readAsDataURL: angular.noop
      });

      $httpBackend = _$httpBackend_;
      $httpBackend.when('POST', CloudinaryService.upload.getURL()).respond({ public_id: '1234' });

      $upload = _$upload_;
      spyOn($upload, 'upload').and.callThrough();
      
      spyOn(CloudinaryService.upload, 'readFile').and.callThrough();
      spyOn(CloudinaryService.upload, 'setStatus').and.callThrough();
      spyOn(CloudinaryService.upload, 'chainUpload').and.callThrough();
      spyOn(CloudinaryService.upload, 'uploadCloudinary').and.callThrough();
    }));

    describe('.resources', function () {
      beforeEach(function() {
        CloudinaryService.upload.resources(files, {}, callbackReadFiles).then(function(results){ 
          expect(results.files.length).toEqual(2);
          expect(_.every(results.files, 'public_id')).toBeTruthy();
          expect(_.every(results.files, { status: { code: 3 } })).toBeTruthy();
          expect(_.every(results.files, { status: { message: 'Uploaded' } })).toBeTruthy();
        });
        $httpBackend.flush();
        $rootScope.$apply();
      });

      it('should callbackReadFiles to have been called', function() {
        expect(callbackReadFiles).toHaveBeenCalled();
      });

      it('should .readFile and FileReader to have been called 2 times', function() {
        expect(CloudinaryService.upload.readFile.calls.count()).toEqual(2);
        expect(window.FileReader.calls.count()).toEqual(2);
      });

        // set status 1 (waiting); 2 (uploading); 3 (uploaded) * files.length
      it('should setStatus to have been called 6 times', function() {
        expect(CloudinaryService.upload.setStatus.calls.count()).toEqual(6);
      });

      it('should chainUpload to have been called', function() {
        expect(CloudinaryService.upload.chainUpload).toHaveBeenCalled();
      });

      it('should uploadCloudinary and $upload.upload to have been called 2 times', function() {
        expect(CloudinaryService.upload.chainUpload).toHaveBeenCalled();
        expect($upload.upload).toHaveBeenCalled();
      });
    });

    describe('.resources without callbackReadFiles', function() {
      beforeEach(function() {
        CloudinaryService.upload.resources(files).then(function(result){ 
          expect(result.message).toEqual('completed');
        });
        $httpBackend.flush();
        $rootScope.$apply();
      });

      it('should callbackReadFiles not to have been called', function() {
        expect(callbackReadFiles).not.toHaveBeenCalled();
      });
    });
  });

  // Cloudinary.resources
  describe('resources', function() {
    beforeEach(function(){
      this.resources = CloudinaryService.resources;
    });

    it('should data is array & empty', function() {
      expect(this.resources.data).toEqual(jasmine.any(Array));
      expect(this.resources.data.length).toEqual(0);
    });

    it('should populate', inject(['$q', 'cloudinary.api', function($q, CloudinaryAPI){
      // mock cloudinary.api.query
      spyOn(CloudinaryAPI, 'query').and.callFake(function() {
        var deferred = $q.defer();
        deferred.resolve({ resources: [{'public_id': 'image1', tags:['example'], bytes: 1024}] });
        return {$promise:deferred.promise};
      });
      this.resources.populate().then(function(data){
        expect(data.resources).toBeDefined();
      });
      expect(CloudinaryAPI.query).toHaveBeenCalledWith({tags:true});
    }]));

    describe('dummy data', function() {
      beforeEach(function() {
        // set dummy data
        this.resources.data = CloudinaryService.dummy();
      });

      it('should data lenght greater than 0', function() {
        expect(this.resources.data.length).toBeGreaterThan(0);
      });

      describe('set:selected,focus,clear', function() {
        var item;
        beforeEach(function() {
          item = this.resources.data[5];
          this.resources.setSelected(item);
          this.resources.setFocus(item);
        });

        it('should item is selected n focus', function() {
          expect(item.selected).toBeTruthy();
          expect(item.focus).toBeTruthy();
        });

        it('should to be resource detail selected', function() {
          expect(this.resources.selected.detail).toBe(item);
        });

        it('should get classname on item selected', function() {
          var className = this.resources.getClassName(item);
          expect(className).toEqual('status-selected status-focus');
        });

        describe('clear()', function() {
          beforeEach(function() {
            this.resources.clear();
          });

          it('should resource detail to be null', function() {
            expect(this.resources.selected.detail).toBeNull();
          });

          it('should all resources data unselected & unfocus', function() {
            expect(_.some(this.resources.data, 'selected')).toBeFalsy();
            expect(_.some(this.resources.data, 'focus')).toBeFalsy();
          });
        });
      });

      describe('selected', function() {
        var item1, item2;
        beforeEach(function() {
          expect(this.resources.selected.detail).toBeNull();
          expect(this.resources.selected.data.length).toEqual(0);

          item1 = this.resources.data[5];
          item2 = this.resources.data[10];
          this.resources.selected.add(item1);
          this.resources.selected.add(item2);
        });

        it('should have 2 selected data', function() {
          expect(this.resources.selected.data.length).toBe(2);
        })

        it('should set active', function() {
          this.resources.selected.setActive(1);
          expect(this.resources.selected.data[1].active).toBeTruthy();
        });

        it('should set single data', function() {
          this.resources.selected.set(['item']);
          expect(this.resources.selected.data.length).toBe(1);
        });

        it('should have 1 selected data, when unset', function() {
          this.resources.selected.setActive(1);
          this.resources.selected.unset(item2);
          expect(_.indexOf(this.resources.selected.data, item2)).toEqual(-1);
          expect(this.resources.selected.data.length).toBe(1);
        });

        it('should last selected data is selected, when force unset', function() {
          this.resources.selected.setActive(1);
          this.resources.selected.unset(item2, true);
          expect(item1.selected).toBeTruthy();
        });
      });
    })
  });
});
