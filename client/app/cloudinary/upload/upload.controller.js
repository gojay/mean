'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryUploadCtrl', function($scope, $log, $q, $loading, CloudinaryService) {
        var $parent = $scope.$parent;

    	// set files model (object), for watching scope on isolate scope (directive tab)
    	$scope.files = { 
    		images: null,
    		rejected: null
    	};

        $scope.callbackReadFiles = function(files) {
            var deferred = $q.defer();
            $parent.setActiveTab(1);
            $parent.promiseResources = $parent.getResources().then(function(data) {
                var newFiles = _.map(files, function(file){
                    file['public_id'] = file.name;
                    file.selected = false;
                    file.focus = false;
                    file.hover = false;
                    return file;
                });
                // unshift new file
                Array.prototype.unshift.apply(data, newFiles);
                // set new resources data
                CloudinaryService.resources.data = data;
                // resolve
                deferred.resolve(files);
            });
            return deferred.promise;
        };

        $scope.$watch('files.images', function(files) {
            if (_.isEmpty(files)) return; 

            $loading.start('Reading files...');

            var rejectedFiles = [];

            CloudinaryService.upload.resources(files, { tag: $parent.tag }, $scope.callbackReadFiles)
                .then(function resolve(result) {
                    $log.log('upload:sucess', result, rejectedFiles);
                    if(_.isEmpty(rejectedFiles)) return;
                    // remove the resources data from rejected files
                    _.remove(CloudinaryService.resources.data, function(item) {
                        return ~_.indexOf(rejectedFiles, item['public_id']);
                    });
                    return;
                }, function reject(error) {
                    $log.error('upload:error', error);
                    return;
                }, function notify(result) {
                    $log.info('upload:notify', result);
                    rejectedFiles.push(result.file['public_id']);
                    return;
                }).finally($loading.stop);
        });
    });
