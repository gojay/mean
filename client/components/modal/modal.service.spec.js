'use strict';

describe('Service: Modal', function() {

    beforeEach(module('exampleAppApp'));

    var fakeModal = {
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

    beforeEach(inject(function($modal, Modal) {
    	this.$modal = $modal;
    	this.Modal = Modal;

    	spyOn(this.$modal, 'open').andReturn(fakeModal);
    }));

    it('open confirm delete', function() {
    	var cb = jasmine.createSpy('cb');
    	var openDelete = this.Modal.confirm.delete(cb);

    	var instance = openDelete('test', {_id:1});
    	expect(this.$modal.open).toHaveBeenCalled();

    	instance.close();
    	expect(cb).toHaveBeenCalledWith({_id:1});
    });

    it('open auth', inject(function(Auth) {
    	spyOn(Auth, 'isLoggedIn').andReturn(false);

    	var cb = {
    		close: angular.noop,
    		cancel: angular.noop
    	};
    	spyOn(cb, 'close').andCallThrough();

    	var openAuth = this.Modal.auth(cb.close);
    	var instance = openAuth();
    	expect(this.$modal.open).toHaveBeenCalled();

    	instance.close();
    	expect(cb.close).toHaveBeenCalled();
    }));
});
