'use strict';

angular.module('exampleAppApp')
    .controller('CloudinaryResourcesDetailCtrl', function($scope, $log, $loading, $timeout) {

        $scope.sizes = {
            options: {},
            custom : {},
            init: function(data){
                if( !data ) return;

                this.width  = this.custom.width = data.width;
                this.height = this.custom.height = data.height;

                this.custom.max = _.max([data.width, data.height]);
                this.custom.min = _.min([data.width, data.height]);

                this.ratio = data.width / data.height;

                this.percentage = [
                    {
                        max: 600,
                        name: 'Thumb',
                        percent: 30
                    },
                    {
                        max: 250,
                        name: 'Medium',
                        percent: 50
                    }
                ];

                this.data = data;

                return this;
            },
            isCustom: function(){
                if(!this.selected) return false;
                return /^custom/i.test(this.selected.name);
            },
            calc: function(direction){
                if(direction == 'width')
                    this.custom.width = Math.round(this.width/this.height * this.custom.height);
                else
                    this.custom.height = Math.round(this.height/this.width * this.custom.width);

                this.selected.name = 'Custom ('+this.custom.width+'x'+this.custom.height+')' ;
                this.selected.size = this.custom;
            },
            convert: function(percentage) {
                if(!percentage) {
                    var name = 'Original ('+ this.width +'x'+ this.height +')';
                    var size = { width: this.width, height: this.height };
                    return { name: name, size: size };
                }

                if( this.width > this.height && this.width > percentage.max || this.width < this.height && this.height > percentage.max || this.ratio == 1 && this.width > percentage.max ) {
                    var size = { width: Math.round(this.width * percentage.percent / 100), height: Math.round(this.height * percentage.percent / 100) };
                    var name = percentage.name + ' ('+ size.width +'x'+ size.height +')';
                    return { name: name, size: size };
                }

                return null;
            },
            get: function() {
                var self = this;
                var sizes = [];
                
                _.each(this.percentage, function(value){
                    var size = self.convert(value);
                    if(size) sizes.push(size);
                });

                sizes.push({ name: 'Custom' });
                sizes.push(this.convert());

                this.options = sizes;

                if( this.data.custom ) {
                    this.set();
                } else {
                    this.selected = _.last(sizes);
                }
            },
            set: function() {
                var options = this.data.custom;
                this.selected = this.options[options.index];
                if( options.size ) {
                    this.custom = _.assign(this.custom, options.size);
                    this.calc();
                }
            }
        };

        /* Dispatch to sibling (CloudinaryResourcesCustomCtrl) resource request */

        $scope.getResource = function() {
            $scope.$parent.$broadcast('resource:request');
        };

        /* Dispatch to parent (CloudinaryCtrl) resource on change size */

        $scope.$watchCollection('sizes.selected', function(newVal, oldVal) {
            if(!newVal || !_.has(newVal, 'size')) return;
            var index = _.findIndex($scope.sizes.options, newVal) || 2 ; // default 2
            $scope.$emit('resource:onchange:size', { index: index, options: newVal.size });
        });

        /* Dispatch to parent (CloudinaryCtrl) resources delete */

        $scope.delete = function(){
            $scope.$emit('resources:delete', 'detail');
        };

        /* Listener resource on change detail */
        /**
         * Listener resource on change detail
         * @param Event  event
         * @param Object data - resources selected detail
         */
        $scope.$on('resource:onselected:detail', function(event, data) {
            $scope.sizes.init(data).get();
        });
    });
