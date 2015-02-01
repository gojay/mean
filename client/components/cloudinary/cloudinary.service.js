'use strict';

angular.module('exampleAppApp')
.service('CloudinaryService', [
    'cloudinary.api', 
	'cloudinary.upload', 
    'cloudinary.dummy',
    'cloudinary.resources',
	function(cloudinaryAPI, cloudinaryUpload, cloudinaryDummy, cloudinaryResources) {
        this.api = cloudinaryAPI;
        this.upload = cloudinaryUpload;
        this.dummy = cloudinaryDummy;
		this.resources = cloudinaryResources;
	}
])
.service('cloudinary.api', function($resource) {
    return $resource('/api/cloudinary/:id', {}, {
        query : { method: 'GET', isArray: false, cache: true },
        remove: { method: 'DELETE' }
    });
})
.factory('cloudinary.upload', function($q, $log, $upload, $window, $timeout, CLOUDINARY_CONFIG) {
    /* set cloudinary config */
    $.cloudinary.config({ cloud_name: CLOUDINARY_CONFIG.cloud_name, api_key: CLOUDINARY_CONFIG.api_key});
    return {
        /**
         * Constructor upload image files to cloudinary
         * @param  {Files} files The image files
         * @return {Promise}
         */
        resources: function(files, options, callbackReadFiles) {
            var self = this;

            self.notification_url = $window.location.origin + '/api/cloudinary/hooks';
            self.url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CONFIG.cloud_name + '/upload';
            self.options = options || {};
            self.until = files.length - 1;

            return self.prepare(files)
                .then(function(result) {
                    $log.log('upload:prepared', result);
                    return result;
                })
                .then(function(files) {
                	if(!callbackReadFiles) return files;
                	return callbackReadFiles(files);
                })
                .then(function(files) {
                	return self.chainUpload(files);
                });
        },
        getURL: function() {
            return self.url;
        },
        /**
         * prepare image files (dataURI) before uploading
         * @param  {Files} files The image files
         * @return {Promise}
         */
        prepare: function(files) {
            var deferred = $q.defer();
            var self = this;
            var promises = files.map(function(file) {
                file.progress = 0;
                file.status = self.setStatus(1);
                return self.readFile(file);
            });
            return $q.all(promises);
        },
        /**
         * Get image file data URI
         * @param  {File} file The image file
         * @return {Promise}
         */
        readFile: function(file) {
            var deferred = $q.defer();
            var fr = new FileReader();
            fr.addEventListener('load', function(e) {
                file.url = e.target.result;
                deferred.resolve(file);
            });
            fr.readAsDataURL(file);
            return deferred.promise;
        },
        /**
         * Set status code & message on the image file
         * @param {Int} code Te status code
         * @param {Object} info
         */
        setStatus: function(code, message) {
            var status = {
                '-1': {
                    code: -1,
                    message: 'Failed'
                },
                '0': {
                    code: 0,
                    message: 'Existing'
                },
                '1': {
                    code: 1,
                    message: 'Waiting..'
                },
                '2': {
                    code: 2,
                    message: 'Uploading...'
                },
                '3': {
                    code: 3,
                    message: 'Uploaded'
                }
            };

            var statusSelected = status[code];
            if(message) {
                statusSelected.message = message;
            }

            return statusSelected;
        },
        /**
         * Chaining promise upload
         * @param  {Files} files The image files
         * @return {Promise}
         */
        chainUpload: function(files) {
            var self = this;

            var deferred = $q.defer();
            var promises = files.reduce(function(promise, file, index) {
                return promise.then(function() {
                    return self.uploadCloudinary(file, index)
                        .then(function(response) {
                            if(file.existing) return;
                            file = _.assign(file, response);
                            file.status = self.setStatus(3);
                        })
                        .then(function() {
                            if(index == files.length - 1) {
                                return {
                                    message:'completed',
                                    files: files
                                };
                            }
                        });
                });
            }, deferred.promise);

            deferred.resolve();

            return promises;
        },
        /**
         * Upload to Cloudinary
         * @param  {File} file  The image file
         * @return {Promise}
         */
        uploadCloudinary: function(file) {
        	var self = this;
            file.status = self.setStatus(2);

            var filename = file.name.replace(/\.[^/.]+$/, '');

            var data = _.assign({ 
            	upload_preset: CLOUDINARY_CONFIG.upload_preset,
                context: $.param({ alt: filename }),
                public_id: filename
            }, self.options);

            var deferred = $q.defer();
            $upload.upload({
                url : self.url,
                data: data,
                file: file
            }).progress(function(e) {
                file.progress = Math.round((e.loaded * 100.0) / e.total);
                file.status.message = "Uploading... " + file.progress + "%";
            }).success(function(file) {
                if(file.existing) {
                    file.status = self.setStatus(0, 'Existing image file');
                    deferred.notify(file);
                }
                deferred.resolve(file);
            }).error(deferred.reject);
            return deferred.promise;
        },
        /**
         * upload dummy files
         * @param  {File} file  The image files
         * @param  {Int} index  The index files
         * @return {Promise}       
         */
        uploadDummy: function(file, index) {
        	var self = this;
            file.status = self.setStatus(2);

            var deferred = $q.defer();
            $timeout(function() {
                file['created_at'] = file.lastModifiedDate;
                if(index == 1 || index == 2) {
                    file.status = self.setStatus(0, 'Existing image file');
                    file.existing = true;
                    deferred.notify({file:file, index:index});
                } 
        	   deferred.resolve(file);
            }, _.random(1,5) * 100);
            return deferred.promise;
        }
    }
})
.factory('cloudinary.dummy', function() {
    function createTags() {
        var tags = [];
        var min = _.random(1,5);
        var max = _.random(min, min + _.random(1,5));
        _.forEach(_.range(min, max), function(num) {
            tags.push('tag' + num);
        });
        return tags.join(',');
    };

    return function (until) {
        var data = []
        until = until || 30;
        _.forEach(_.range(0, until), function(num) {
            var name = 'image-' + num;
            data.push({
                url: 'http://placehold.it/250x200&text=' + name,
                public_id: name,
                selected: false,
                focus: false,
                hover: false,
                tag: createTags(),
                created_at: new Date()
            });
        });
        return data;
    };
})
.factory('cloudinary.resources', [
    '$q',
    '$timeout',
    '$loading',
    'cloudinary.api', 
    'cloudinary.dummy', 
    function($q, $timeout, $loading, cloudinaryAPI, cloudinaryDummy) {
        return {
            edit: false,
            data: [],
            populate: function() {
                $loading.start('Getting resources..');

                var deferred = $q.defer();

                if( this.data.length ) {
                    $loading.stop();
                    deferred.resolve($scope.resources.data);
                }

                cloudinaryAPI.query({ tags: true, /*searchByTag: $scope.tag*/ }).$promise.then(function(data) {
                    var resources = _.map(data.resources, function(item) {
                        item.tags = item.tags.join(', ');
                        item.size = Math.round(item.bytes/1024);
                        return item;
                    });
                    $loading.stop();
                    deferred.resolve(resources);
                });

                return deferred.promise;
            },
            clear: function() {
                this.data = _.map(this.data, function(item) {
                    item.focus = false;
                    item.selected = false;
                    return item;
                });
                this.selected.detail = null;
                this.selected.data = [];
            },
            setSelected: function(item) {
                this.data = _.map(this.data, function(item) {
                    item.selected = false;
                    return item;
                });
                item.selected = true;
            },
            setFocus: function(item) {
                this.data = _.map(this.data, function(item) {
                    item.focus = false;
                    return item;
                });
                item.focus = true;

                this.selected.detail = item;
                var _moment = moment(new Date(item.created_at));
                if(_moment.isValid()) {
                    this.selected.detail.created_at = _moment.format("MMMM Do, YYYY");
                }   
            },
            getClassName: function(item) {
                var className = [];
                if(item.selected === true)
                    className.push('status-selected');
                if(item.focus === true)
                    className.push('status-focus');
                if(item.status && item.status.code == -1)
                    className.push('status-warning');
                if(item.status && item.status.code == 0)
                    className.push('status-error');
                if(item.status && item.status.code == 1)
                    className.push('status-waiting');
                if(item.status && item.status.code == 2)
                    className.push('status-uploading');
                return className.join(' ');
            },
            getIconClass: function(item) {
                var icon;
                if(item.selected) {
                    icon = item.hover ? 'fa-minus-square' : 'fa-check-square';
                    if(!item.focus) {
                        icon += '-o'
                    }
                } 
                return icon;
            },
            selected: {
                detail: null,
                data: [],
                isActive: function(index) {
                    var selected = this.data[index];
                    return _.has(selected, 'active') && selected.active === true;
                },
                setActive: function(index) {
                    this.data = _.map(this.data, function(item) {
                        item.active = false;
                        return item;
                    });
                    this.data[index].active = true;
                },
                add: function(item) {
                    item.selected = true;
                    this.data.push(item);
                },
                set: function(item) {
                    this.data = [item];
                },
                unset: function(item, force) {
                    item.focus = false;
                    item.selected = false;
                    var index = this.data.indexOf(item);
                    this.data.splice(index, 1);

                    var last = _.last(this.data);
                    if(!last) {
                        this.detail = null;
                        return;
                    }

                    if(force) {
                        last.focus = true;
                        last.selected = true;
                    }
                    this.detail = _.last(this.data);
                    if(moment(item.created_at).isValid()) {
                        this.detail.created_at = moment(Date.parse(last.created_at)).format("MMMM Do, YYYY");
                    }   
                }
            }
        }
    }
]);
