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
  describe('upload', function() {
    var files = [{name:'file1'}, {name:'file2'}];
    var deferredPrepare, callbackReadFiles;
    beforeEach(inject(function($q) {
      callbackReadFiles = jasmine.createSpy().and.callFake(function(params) {
        var deferred = $q.defer();
        deferred.resolve(params);
        return deferred.promise;
      });

      deferredPrepare = $q.defer();
      spyOn(CloudinaryService.upload, 'prepare').and.returnValue(deferredPrepare.promise);
      spyOn(CloudinaryService.upload, 'uploadCloudinary').and.callFake(function(file) {
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
      // resolve prepare promise
      deferredPrepare.resolve(files);
      $rootScope.$apply();
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

        it('should get classname', function() {
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
