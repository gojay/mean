'use strict';

describe('Service: $loading', function () {

  // load the service's module
  beforeEach(module('exampleAppApp'));

  // instantiate service
  var $loading;
  beforeEach(inject(function (_$loading_) {
    $loading = _$loading_;
  }));

  it('shoud is defined', function() {
    expect($loading).toBeDefined();
  });

  it('should default is deactive, & message is empty', function() {
    expect($loading.active).toBeFalsy();
    expect($loading.message).toEqual('');
  });

  describe('start()', function() {
    beforeEach(function() {
      $loading.start();
    });

    it('should active n show message when start()', function() {
      expect($loading.active).toBeTruthy();
      expect($loading.message).toEqual('Please wait...');
    });

    it('should change message when is actived', function() {
      expect($loading.active).toBeTruthy();
      $loading.start('loading');
      expect($loading.message).toEqual('loading');
    });

    it('should stop() to be deactive & message is empty', function() {
      $loading.stop();
      expect($loading.active).toBeFalsy();
      expect($loading.message).toEqual('');
    });
  })

});
