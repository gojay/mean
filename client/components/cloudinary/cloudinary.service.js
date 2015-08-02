'use strict';

angular.module('exampleAppApp')
.service('CloudinaryService', [
    'cloudinary.api', 
	'cloudinary.upload', 
    'cloudinary.dummy',
    'cloudinary.resources',
    'cloudinary.helpers',
	function (cloudinaryAPI, cloudinaryUpload, cloudinaryDummy, cloudinaryResources, cloudinaryHelpers) {
        this.api = cloudinaryAPI;
        this.upload = cloudinaryUpload;
        this.dummy = cloudinaryDummy;
        this.resources = cloudinaryResources;
		this.helpers = cloudinaryHelpers;
	}
])
.service('cloudinary.api', function($resource) {
    return $resource('/api/cloudinary/:id', {}, {
        query : { method: 'GET', isArray: false, cache: true },
        remove: { method: 'DELETE' }
    });
})
.factory('cloudinary.helpers', ['CLOUDINARY_CONFIG', function (CLOUDINARY_CONFIG){
    return {
        url: function( image, config ) {
            var url = 'http://res.cloudinary.com';
            url += '/' + CLOUDINARY_CONFIG.cloud_name + '/image/upload';
            if(config && (config.width || config.height)) {
                var c = config.width && config.height ? ['c_fit'] : ['c_fill'];
                if(config.width) c.push('w_'+ config.width); 
                if(config.height) c.push('h_'+ config.height); 
                url += '/' + c.join(',');
            }
            url += '/v' + image.version +'/'+ image.public_id +'.'+ image.format;
            return url;
        }
    };
}])
.factory('cloudinary.upload', [
    '$q', 
    '$log', 
    '$upload', 
    '$window', 
    '$timeout', 
    'CLOUDINARY_CONFIG',
    'cloudinary.api',
    function ($q, $log, $upload, $window, $timeout, CLOUDINARY_CONFIG, cloudinaryAPI) {
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

                // self.notification_url = $window.location.origin + '/api/cloudinary/hooks';
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
                    },
                    '4': {
                        code: 4,
                        message: 'Get detail...'
                    },
                    '5': {
                        code: 5,
                        message: 'Completed'
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
                                return file;
                            })
                            .then(function(file) {
                                file.status = self.setStatus(4);
                                return cloudinaryAPI.get({ id: file['public_id'] }).$promise.then(function(result){
                                    file.derived = result.derived;
                                    file.status = self.setStatus(5);
                                    return file;
                                });
                            })
                            .then(function(result) {
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
                    context: $.param({ alt: filename, caption: filename }),
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
                        deferred.notify({file:file, index:index});
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
    }
])
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
                format: 'jpg',
                url: 'http://placehold.it/250x200&text=' + name,
                public_id: name,
                selected: false,
                focus: false,
                hover: false,
                width: 800,
                height: 600,
                tag: createTags(),
                created_at: new Date(),
                derived: {
                    selected: null,
                    data: [
                        {
                            "transformation": "c_fill,e_sepia,h_230,r_14,w_150/a_199",
                            "format": "jpg",
                            "bytes": 17683,
                            "id": "f2c55a8350b4b90cdb9ace462c3189ec",
                            "url": "http://res.cloudinary.com/doztst1iv/image/upload/c_fill,e_sepia,h_230,r_14,w_150/a_199/v1421826791/sample.jpg",
                            "secure_url": "https://res.cloudinary.com/doztst1iv/image/upload/c_fill,e_sepia,h_230,r_14,w_150/a_199/v1421826791/sample.jpg"
                        },
                        {
                            "transformation": "c_fill,h_230,w_150",
                            "format": "jpg",
                            "bytes": 16495,
                            "id": "bdfa51f842e565a97de343e3efdcb8aa",
                            "url": "http://res.cloudinary.com/doztst1iv/image/upload/c_fill,h_230,w_150/v1421826791/sample.jpg",
                            "secure_url": "https://res.cloudinary.com/doztst1iv/image/upload/c_fill,h_230,w_150/v1421826791/sample.jpg"
                        },
                        {
                            "transformation": "t_media_lib_thumb",
                            "format": "jpg",
                            "bytes": 10212,
                            "id": "3aab54946c42653735ecfeddcb24af04",
                            "url": "http://res.cloudinary.com/doztst1iv/image/upload/t_media_lib_thumb/v1421826791/sample.jpg",
                            "secure_url": "https://res.cloudinary.com/doztst1iv/image/upload/t_media_lib_thumb/v1421826791/sample.jpg"
                        }
                    ]
                },
                context: {
                    alt: name,
                    caption: name,
                    title: name
                }
            });
        });
        return data;
    };
})
.factory('cloudinary.resources', [
    '$q',
    '$timeout',
    'cloudinary.api', 
    'cloudinary.dummy', 
    'cloudinary.helpers',
    function ($q, $timeout, cloudinaryAPI, cloudinaryDummy, cloudinaryHelpers) {
        var resources = {
            edit: false,
            data: [],
            populate: function( options ) {
                this.options = options;
                if( this.data.length ) {
                    console.log('populated',self.data)
                    return $q(function (resolve) {
                        resolve(self.data);
                    });
                }
                return self.next();
            },
            next: function() {
                console.log('next', this.options.query);
                return cloudinaryAPI.query(this.options.query).$promise.then(this.transformation.bind(this));
            },
            transformation: function (data) {
                var self = this;
                var resources = _.map(data.resources, function (item) {
                    item._url = cloudinaryHelpers.url(item, self.options.image);
                    item.tags = item.tags.toString();
                    item.size = Math.round(item.bytes/1024);
                    return item;
                });
                self.options.query.next_cursor = data.next_cursor;
                self.data = self.data.concat(resources);
            },
            clear: function() {
                this.data = _.map(this.data, function(item) {
                    item.active = false;
                    item.focus = false;
                    item.selected = false;
                    return item;
                });
            },
            setSelected: function(item) {
                this.data = _.map(this.data, function(item) {
                    item.selected = false;
                    item.focus = false;
                    item.active = false;
                    return item;
                });
                item.selected = true;
                item.focus = true;
            },
            getSelected: function(property){
                var self = this;
                var selected = _.filter(this.data, 'selected');
                if( property ) {
                    if( _.isObject(property) ) {
                        var key = Object.keys(property)[0];
                        var value = property[key];
                        var hasKey = _.every(selected, function(item){
                            return item[key] && _.has(item[key], value);
                        });
                        return _.map(selected, function(item){
                            var url;
                            if( !item[key] ) {
                                if( value == 'url' ) {
                                    url = $.cloudinary.url(item['public_id']) + '.' + item.format;
                                } 
                            } else {
                                url = item[key][value];
                            }
                            
                            return {
                                url: url,
                                context: item.context
                            }
                        });
                    }

                    if(_.every(selected, property)) {
                        return _.map(selected, function(item){
                            return selected[property];
                        });
                    }
                    return selected;
                }
                return selected;
            },
            setFocus: function(item) {
                this.data = _.map(this.data, function(item) {
                    item.focus = false;
                    return item;
                });
                item.focus = true;
            },
            getFocus: function(){
                return _.filter(this.data, 'focus')[0];
            },
            getClassName: function(item) {
                var className = [];
                if(item.selected === true)
                    className.push('status-selected');
                if(item.focus === true)
                    className.push('status-focus');
                if(item.status) {
                    var uploadClass;
                    if(item.status.code == -1)
                        uploadClass = 'status-upload-warning';
                    else if(item.status.code == 0)
                        uploadClass = 'status-upload-error';
                    else if(item.status.code == 1)
                        uploadClass = 'status-upload-waiting';
                    else if(item.status.code == 2)
                        uploadClass = 'status-upload-uploading';
                    else if(item.status.code == 3)
                        uploadClass = 'status-upload-uploaded';
                    else if(item.status.code == 4)
                        uploadClass = 'status-upload-detail';
                    else if(item.status.code == 5)
                        uploadClass = 'status-upload-completed';

                    var index = _.findIndex(className, function(item){ return /upload/.test(item); })
                    if(~index) {
                        className[index] = uploadClass
                    } else 
                        className.push(uploadClass);
                }
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
            getImgClass: function(item) {
                var className = [];
                if(item.status && item.status.code == '-1') className.push('bg-danger');
                else if(item.status && item.status.code == 0) className.push('bg-warning');
                if(this.getSelected().length) className.push(' img-thumbnail');
                return className.join(' ');
            },
            url: function( custom ) {
                var item = this.getFocus();
                if( !item ) return;

                item.custom = custom;

                if( custom.options && (custom.options.width != item.width || custom.options.height != item.height) ) {
                    var firstArgs  = _.omit(custom.options, 'angle'),
                        secondArgs = _.pick(custom.options, 'angle');
                    if(!_.has(firstArgs, 'crop')) firstArgs.crop = 'fill';
                    custom.cloudinary = { transformation: [firstArgs, secondArgs] };
                }

                var url = $.cloudinary.url(item['public_id'], custom.cloudinary) + '.' + item.format;
                item.custom.url = url;

                return url;
            },
            getDetail: function(){
                var detail = this.getFocus();
                if(_.isEmpty(detail)) return;

                var _moment = moment(new Date(detail.created_at));
                if(_moment.isValid()) {
                    detail.created_at = _moment.format("MMMM Do, YYYY");
                }   
                return detail;
            },
            setActive: function(index){
                var selected = this.getSelected();
                if(_.isEmpty(selected)) return;

                this.data = _.map(this.data, function(item){
                    item.active = false;
                    item.focus = false;
                    return item;
                });
                this.data[index].active = true;
                this.data[index].focus = true;
            },
            addSelected: function(item){
                item.selected = true;
                this.data = _.map(this.data, function(item) {
                    item.focus = false;
                    return item;
                });
                item.focus = true;
            },
            unSelected: function(item, force){
                item.focus = false;
                item.selected = false;

                var last = _.last(this.getSelected());
                if(_.isEmpty(last)) return;

                last.active = true;
                last.focus = true;
                last.selected = true;
            }
        };

        return resources;
    }
]);
