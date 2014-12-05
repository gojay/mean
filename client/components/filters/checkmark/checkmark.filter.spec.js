'use strict';

describe('Filter: checkmark', function () {

  // load the filter's module
  beforeEach(module('exampleAppApp'));

  // initialize a new instance of the filter before each test
  var checkmark;
  beforeEach(inject(function ($filter) {
    checkmark = $filter('checkmark');
  }));

  it('should convert boolean values to unicode checkmark or cross', function () {
    var text = 'angularjs';
    expect(checkmark(true)).toBe('\u2713');
    expect(checkmark(false)).toBe('\u2718');
  });

});
