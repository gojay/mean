'use strict';

angular.module('exampleAppApp')
  .factory('Modal', function ($rootScope, $modal, Auth) {
    /**
     * Opens a modal
     * @param  {Object} scope      - an object to be merged with modal's scope
     * @param  {String} modalClass - (optional) class(es) to be applied to the modal
     * @return {Object}            - the instance $modal.open() returns
     */
    function openModal(scope, modalClass) {
      var modalScope = $rootScope.$new();
      scope = scope || {};
      modalClass = modalClass || 'modal-default';

      var template = scope.modal.template ? { template: scope.modal.template } : { templateUrl: 'components/modal/modal.html' };
      var options = angular.extend({
        windowClass: modalClass,
        scope: modalScope
      }, template);

      angular.extend(modalScope, scope);

      return $modal.open(options);
    }

    // Public API here
    return {

      /* Confirmation modals */
      confirm: {

        /**
         * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
         * @param  {Function} del - callback, ran when delete is confirmed
         * @return {Function}     - the function to open the modal (ex. myModalFn)
         */
        delete: function(del) {
          del = del || angular.noop;

          /**
           * Open a delete confirmation modal
           * @param  {String} name   - name or info to show on modal
           * @param  {All}           - any additional args are passed staight to del callback
           */
          return function() {
            var args = Array.prototype.slice.call(arguments),
                name = args.shift(),
                deleteModal;

            deleteModal = openModal({
              modal: {
                dismissable: true,
                title: 'Confirm Delete',
                html: '<p>Are you sure you want to delete <strong>' + name + '</strong> ?</p>',
                buttons: [{
                  classes: 'btn-danger',
                  text: 'Delete',
                  click: function(e) {
                    deleteModal.close(e);
                  }
                }, {
                  classes: 'btn-default',
                  text: 'Cancel',
                  click: function(e) {
                    deleteModal.dismiss(e);
                  }
                }]
              }
            }, 'modal-danger');

            deleteModal.result.then(function(event) {
              del.apply(event, args);
            }, angular.noop);

            return deleteModal;
          };
        }
      },  

      /* Auth Signin/Signup modals */
      auth: function(cbClose, cbCancel) {
        cbClose = cbClose || angular.noop;
        cbCancel = cbCancel || angular.noop;

        return function() {
          if(Auth.isLoggedIn()) return;

          var args = Array.prototype.slice.call(arguments);

          var authModal = openModal({
            modal: {
              template: '<div class="modal-header" style="border-bottom:0">' +
                  '<h3 class="modal-title text-center">Authentication</h3>' +
              '</div>' +
              '<div class="modal-body" style="padding:0">' +
                  '<tabset justified="true">'+
                      '<tab>' +
                          '<tab-heading>Sign in</tab-heading>' +
                          '<div style="padding:20px">' +
                              '<login-form login-dialog="true" login-success="modal.close($event)"></login-form>' +
                          '</div>' +
                      '</tab>' +
                      '<tab>' +
                          '<tab-heading>Sign up</tab-heading>' +
                          '<div style="padding:20px">' +
                              '<signup-form signup-dialog="true" signup-success="modal.close($event)"></signup-form>' +
                          '</div>' +
                      '</tab>' +
                  '</tabset>' +
              '<div class="modal-footer">' +
                  '<button class="btn btn-warning" ng-click="modal.cancel($event)">Cancel</button>' +
              '</div>',
              close: function(e) {
                authModal.close(e);
              },
              cancel: function(e) {
                authModal.dismiss(e);
              }
            }
          }, 'modal-primary');

          authModal.result.then(function(event) {
            cbClose.apply(event, args);
          }, function(event) {
            cbCancel.apply(event, args);
          });

          return authModal;
        }
      }
    };
  });
