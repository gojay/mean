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
      
      spyOn(CloudinaryService.api, 'get').and.callFake(function(){
        var deferred = $q.defer();
        deferred.resolve({ derived: ['somedata'] });
        return { $promise: deferred.promise };
      });

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
          expect(_.every(results.files, { status: { code: 5 } })).toBeTruthy();
          expect(_.every(results.files, { status: { message: 'Completed' } })).toBeTruthy();
          expect(_.every(results.files, 'derived')).toBeTruthy();
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

      // set status 1 (waiting); 2 (uploading); 3 (uploaded); 4 (get detail); 5 (completed) * files.length
      it('should setStatus to have been called 10 times', function() {
        expect(CloudinaryService.upload.setStatus.calls.count()).toEqual(10);
      });

      it('should chainUpload to have been called & api.get to have been called 2 times', function() {
        expect(CloudinaryService.upload.chainUpload).toHaveBeenCalled();
        expect(CloudinaryService.api.get).toHaveBeenCalled();
        expect(CloudinaryService.api.get.calls.count()).toEqual(2);
      });

      it('should uploadCloudinary and $upload.upload to have been called 2 times', function() {
        expect(CloudinaryService.upload.chainUpload).toHaveBeenCalled();
        expect($upload.upload).toHaveBeenCalled();
      });
    });

    describe('.resources without callbackReadFiles, the results is completed', function() {
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
    var resources;
    beforeEach(function(){
      resources = CloudinaryService.resources;
    });

    it('should data is array & empty', function() {
      expect(resources.data).toEqual(jasmine.any(Array));
      expect(resources.data.length).toEqual(0);
    });

    it('should populate & CloudinaryAPI.query to have been called', inject(['$q', 'cloudinary.api', function($q, CloudinaryAPI){
      // mock cloudinary.api.query
      spyOn(CloudinaryAPI, 'query').and.callFake(function() {
        var deferred = $q.defer();
        deferred.resolve({ resources: [{'public_id': 'image1', tags:['example1','example2'], bytes: 1024}] });
        return {$promise:deferred.promise};
      });
      resources.populate().then(function(data){
        data = data;
        expect(resources.data.length).toBeGreaterThan(0);
        expect(resources.data[0].tags).toEqual('example1, example2');
        expect(resources.data[0].size).toEqual(1);
      });
      $rootScope.$digest();
      expect(CloudinaryAPI.query).toHaveBeenCalledWith({tags:true});
    }]));

    describe('data', function() {
      beforeEach(function() {
        // set dummy data
        resources.data = CloudinaryService.dummy();
      });

      it('should data lenght greater than 0', function() {
        expect(resources.data.length).toBeGreaterThan(0);
      });

      describe('set:selected,focus,clear', function() {
        var item;
        beforeEach(function() {
          item = resources.data[5];
          resources.setSelected(item);
        });

        it('should item is selected n focus', function() {
          expect(item.selected).toBeTruthy();
          expect(item.focus).toBeTruthy();
        });

        describe('url', function(){
          var url;
          beforeEach(function(){
            url = resources.url({
                index: 2,
                options: {
                  radius: 20,
                  width: 150,
                  height: 100,
                  crop: "fill",
                  gravity: "north",
                  angle: 20
                }
            });
          });

          it('should generate url', function(){
            expect(/c_fill,g_north,h_100,r_20,w_150\/a_20/.test(url)).toBeTruthy();
          });

          it('should focused item have property custom', function(){
            expect(item.custom).toEqual(jasmine.objectContaining({
              options: {
                radius: 20,
                width: 150,
                height: 100,
                crop: "fill",
                gravity: "north",
                angle: 20
              }
            }));
          })
        });

        it('should get item selected classname', function() {
          var className = resources.getClassName(item);
          expect(className).toEqual('status-selected status-focus');
        });

        describe('clear()', function() {
          beforeEach(function() {
            resources.clear();
          });

          it('should resource detail to be null', function() {
            expect(resources.getDetail()).not.toBeDefined();
          });

          it('should all resources data unselected & unfocus', function() {
            expect(_.some(resources.data, 'selected')).toBeFalsy();
            expect(_.some(resources.data, 'focus')).toBeFalsy();
          });
        });
      });

      describe('selected', function() {
        var item1, item2;
        beforeEach(function() {
          expect(resources.getDetail()).not.toBeDefined();

          item1 = resources.data[5];
          resources.addSelected(item1);

          item2 = resources.data[10];
          resources.addSelected(item2);
        });

        it('should have 2 selected data', function() {
          expect(resources.getSelected().length).toEqual(2);
        });

        it('should focus item is item2', function() {
          expect(resources.getFocus()).toEqual(item2);
        });

        it('should set active', function() {
          resources.setActive(1);
          expect(resources.data[1].active).toBeTruthy();
        });

        it('should set single data', function() {
          var newItem = resources.data[7];
          resources.setSelected(newItem);
          expect(resources.getSelected().length).toBe(1);
        });

        it('should have 1 selected data, when unset', function() {
          resources.setActive(1);
          resources.unSelected(item2);
          expect(_.indexOf(resources.getSelected(), item2)).toEqual(-1);
          expect(resources.getSelected().length).toBe(1);
        });

        it('should last selected data is item1, when force unset item2', function() {
          resources.setActive(1);
          resources.unSelected(item2, true);
          expect(_.indexOf(resources.getSelected(), item2)).toEqual(-1);
          expect(resources.getSelected().length).toBe(1);
          expect(item1.selected).toBeTruthy();
        });
      });

      describe('--scenario:selected-url', function(){
        var item1, item2;
        beforeEach(function() {
          expect(resources.getDetail()).not.toBeDefined();

          item1 = resources.data[5];
          resources.addSelected(item1);

          item2 = resources.data[10];
          resources.addSelected(item2);
        });

        it('should have 2 selected data', function() {
          expect(resources.getSelected().length).toBe(2);
        });

        it('should getSelected url', function(){
          // set focus item2
          resources.setFocus(item2);
          expect(resources.getDetail()).toEqual(item2);

          // generate url selected item
          var custom = {
            index: 2,
            options: {
              width:500, 
              height:300
            }
          };
          resources.url(custom);
          expect(item2.custom).toEqual(custom);

          // change set focus item to item2
          // and generate url
          resources.setFocus(item1);
          expect(resources.getDetail()).toEqual(item1);
          resources.url({index: 1});

          // change back to set focus into item2
          // should have property custom on selected detail
          resources.setFocus(item2);
          expect(resources.getDetail().custom).toEqual(custom);

          // change back to set focus into item1
          // should have property custom on selected detail
          resources.setFocus(item1);
          expect(resources.getDetail().custom).toEqual(jasmine.objectContaining({index:1}));

          var selected = resources.getSelected({ custom: 'url' });
          expect(selected).toEqual(jasmine.any(Array));
          expect(selected[0]).toMatch(/upload\/image-5.jpg$/);
          expect(selected[1]).toMatch(/upload\/c_fill,h_300,w_500\/image-10.jpg$/);
        });
      });
    });

    describe('className', function(){
      var item = {};

      it('should item classname to equal selected', function(){
        item.selected = true;
        expect(resources.getClassName(item)).toEqual('status-selected');
      });

      it('should item classname to equal selected & focus', function(){
        item.selected = true;
        item.focus = true;
        expect(resources.getClassName(item)).toEqual('status-selected status-focus');
      });

      describe('should item classname to equal selected & focus & status upload', function(){
        beforeEach(function(){
          item.selected = true;
          item.focus = true;
          item.status = { code: -1 };
        });

        it('should status-upload to be warning, when status code -1', function(){
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-warning');
        });

        it('should status-upload to be error, when status code 0', function(){
          item.status.code = 0;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-error');
        });

        it('should status-upload to be waiting, when status code 1', function(){
          item.status.code = 1;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-waiting');
        });

        it('should status-upload to be uploading, when status code 2', function(){
          item.status.code = 2;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-uploading');
        });

        it('should status-upload to be uploaded, when status code 3', function(){
          item.status.code = 3;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-uploaded');
        });

        it('should status-upload to be detail, when status code 4', function(){
          item.status.code = 4;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-detail');
        });

        it('should status-upload to be completed, when status code 5', function(){
          item.status.code = 5;
          expect(resources.getClassName(item)).toBe('status-selected status-focus status-upload-completed');
        });
      });
    });
  });
});
