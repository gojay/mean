'use strict';

describe('Controller: CloudinaryResourcesListCtrl', function() {

    // load the controller's module
    beforeEach(module('exampleAppApp'));

    var CloudinaryResourcesListCtrl, $scope, $rootScope, $loading, data, CloudinaryService;

    var _event = {
      ctrlKey: false,
      shiftKey: false,
      target: {
        localName: null
      }
    };

    function getItemByIndex(indexes) {
      if(!_.isArray(indexes)) return data[indexes];
      return _.filter(data, function(item, index) {
         return ~_.indexOf(indexes, index);
      });
    }

    function getSelected(type) {
      var resources = CloudinaryService.resources.selected;
      return type ? resources[type] : resources.data;
    }

    function setEvent(arg) {
      if(arg == 'ctrl') {
        _event.ctrlKey = true;
        _event.shiftKey = false;
      } else if(arg == 'shift') {
        _event.ctrlKey = false;
        _event.shiftKey = true;
      } else if(arg == 'clear') {
        _event.ctrlKey = false;
        _event.shiftKey = false;
        _event.target.localName = null;
      } else {
        _event.ctrlKey = false;
        _event.shiftKey = false;
        if(arg) _event.target.localName = arg;
      }
    }

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, _$rootScope_, _$loading_, _CloudinaryService_) {
        CloudinaryService = _CloudinaryService_;
        CloudinaryService.resources.setDummy(10);

        data = CloudinaryService.resources.data;

        $rootScope = _$rootScope_;
        // mock $parent.loading
        // $rootScope.$parent.loading = jasmine.createSpyObj('loading', ['start', 'stop']);

        $scope = $rootScope.$new();
        $loading = _$loading_;
        $loading.start = jasmine.createSpy();
        $loading.stop = jasmine.createSpy();
        CloudinaryResourcesListCtrl = $controller('CloudinaryResourcesListCtrl', {
            $scope: $scope,
            CloudinaryService: CloudinaryService
        });
    }));

    it('should resources data have 10 items', function() {
      expect(CloudinaryService.resources.data.length).toEqual(10);
    });

    it('should select single item', function() {
        var item = getItemByIndex(2);
        $scope.select(_event, 2, item);
        expect(getSelected()).toEqual([item]);
        expect(getSelected().length).toBeGreaterThan(0);
    });

    it('should select multiple items by ctrlKey', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(getSelected().length).toBe(2);
    });

    it('should select multiple items by shiftKey', function() {
        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(getSelected().length).toEqual(4);
        expect(_.pluck(getSelected(), 'public_id')).toEqual(['image-0', 'image-1', 'image-2', 'image-3']);
    });

    it('should select multiple items by shiftKey. start from < index selected', function() {
        var item1 = getItemByIndex(1);
        $scope.select(_event, 1, item1);
        expect(getSelected().length).toEqual(1);

        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(getSelected().length).toEqual(3);
        expect(_.pluck(getSelected(), 'public_id')).toEqual(['image-1', 'image-2', 'image-3']);

        setEvent('shift');

        var item5 = getItemByIndex(5);
        $scope.select(_event, 5, item5);

        expect(getSelected().length).toEqual(5);
        expect(_.pluck(getSelected(), 'public_id')).toEqual(['image-1', 'image-2', 'image-3', 'image-4', 'image-5']);
    });

    it('should select multiple items by shiftKey. start from > index selected (reverse)', function() {
        var item1 = getItemByIndex(8);
        $scope.select(_event, 8, item1);
        expect(getSelected().length).toEqual(1);

        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(getSelected().length).toEqual(6);
        expect(_.pluck(getSelected(), 'public_id').sort().reverse()).toEqual(['image-8', 'image-7', 'image-6', 'image-5', 'image-4', 'image-3']);
    });

    it('should only active the item', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(getSelected().length).toBe(2);

        $scope.select(_event, 2, item1);
        expect(item1.active).toBeTruthy();
        expect(getSelected().length).toEqual(2);
    });

    it('should unset item, only when that item is activated', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(getSelected().length).toBe(2);

        $scope.select(_event, 2, item1);
        expect(item1.active).toBeTruthy();
        expect(getSelected().length).toEqual(2);

        $scope.select(_event, 2, item1);
        expect(getSelected().length).toEqual(1);
    });

    it('should force unset item through i element', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('i');

        $scope.select(_event, 2, item1);
        expect(getSelected().length).toEqual(0);
    });

    describe('Delete >', function() {
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
        CloudinaryService.api.remove = jasmine.createSpy().andCallFake(function() {
          deferred = $q.defer();
          return { $promise: deferred.promise };
        });
        // mock $modal
        $modal = _$modal_;
        spyOn($modal, 'open').andReturn(fakeModal);

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

        it('should items removed, when choose "ok" on modal', function(){
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

    afterEach(function() {
      setEvent('clear');
    });

});
