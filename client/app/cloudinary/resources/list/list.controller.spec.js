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

        data = CloudinaryService.resources.data = CloudinaryService.dummy(10);

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

    it('--should select single item', function() {
        var item = getItemByIndex(2);
        $scope.select(_event, 2, item);
        expect(CloudinaryService.resources.getSelected()).toEqual([item]);
        expect(CloudinaryService.resources.getSelected().length).toBeGreaterThan(0);
    });

    it('--should select multiple items by ctrlKey', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(CloudinaryService.resources.getSelected().length).toBe(2);
    });

    it('--should select multiple items by shiftKey', function() {
        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(CloudinaryService.resources.getSelected().length).toEqual(4);
        // expect selected items by public_id
        expect(_.pluck(CloudinaryService.resources.getSelected(), 'public_id')).toEqual(['image-0', 'image-1', 'image-2', 'image-3']);
    });

    it('--should select multiple items by shiftKey. start from < index selected', function() {
        var item1 = getItemByIndex(1);
        $scope.select(_event, 1, item1);
        expect(CloudinaryService.resources.getSelected().length).toEqual(1);

        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(CloudinaryService.resources.getSelected().length).toEqual(3);
        expect(_.pluck(CloudinaryService.resources.getSelected(), 'public_id')).toEqual(['image-1', 'image-2', 'image-3']);

        setEvent('shift');

        var item5 = getItemByIndex(5);
        $scope.select(_event, 5, item5);

        expect(CloudinaryService.resources.getSelected().length).toEqual(5);
        expect(_.pluck(CloudinaryService.resources.getSelected(), 'public_id')).toEqual(['image-1', 'image-2', 'image-3', 'image-4', 'image-5']);
    });

    it('--should select multiple items by shiftKey. start from > index selected (reverse)', function() {
        var item1 = getItemByIndex(8);
        $scope.select(_event, 8, item1);
        expect(CloudinaryService.resources.getSelected().length).toEqual(1);

        setEvent('shift');

        var item3 = getItemByIndex(3);
        $scope.select(_event, 3, item3);

        expect(CloudinaryService.resources.getSelected().length).toEqual(6);
        expect(_.pluck(CloudinaryService.resources.getSelected(), 'public_id').sort().reverse()).toEqual(['image-8', 'image-7', 'image-6', 'image-5', 'image-4', 'image-3']);
    });

    it('--should only active the item', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(CloudinaryService.resources.getSelected().length).toBe(2);

        $scope.select(_event, 2, item1);
        expect(item1.active).toBeTruthy();
        expect(CloudinaryService.resources.getSelected().length).toEqual(2);
    });

    it('--should unset item, only when that item is activated', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('ctrl');

        var item2 = getItemByIndex(3);
        $scope.select(_event, 3, item2);

        expect(CloudinaryService.resources.getSelected().length).toBe(2);

        $scope.select(_event, 2, item1);
        expect(item1.active).toBeTruthy();
        expect(CloudinaryService.resources.getSelected().length).toEqual(2);

        $scope.select(_event, 2, item1);
        expect(CloudinaryService.resources.getSelected().length).toEqual(1);
    });

    it('--should force unset item through i element', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('i');

        $scope.select(_event, 2, item1);
        expect(CloudinaryService.resources.getSelected().length).toEqual(0);
    });

    it('--should force unset item through i element', function() {
        var item1 = getItemByIndex(2);
        $scope.select(_event, 2, item1);

        setEvent('i');

        $scope.select(_event, 2, item1);
        expect(CloudinaryService.resources.getSelected().length).toEqual(0);
    });

    afterEach(function() {
      setEvent('clear');
    });

});
