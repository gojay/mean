'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('cloudinary', {
        url: '/cloudinary',
        views: {
        	'': {
        		templateUrl: 'app/cloudinary/index/cloudinary.html',
        		controller: 'CloudinaryCtrl'
        	},
        	'tab1@cloudinary': {
        		templateUrl: 'app/cloudinary/upload/upload.html',
        		controller: 'CloudinaryUploadCtrl'
        	}
        }
      })
      .state('cloudinary.resources', {
      	views: {
      		'tab1': {},
        	'tab2': {
        		templateUrl: 'app/cloudinary/resources/resources.html',
        	},
      		'list@cloudinary.resources': {
        		templateUrl: 'app/cloudinary/resources/list/list.html',
        		controller: 'CloudinaryResourcesListCtrl'
      		},
      		'detail@cloudinary.resources': {
        		templateUrl: 'app/cloudinary/resources/detail/detail.html',
        		controller: 'CloudinaryResourcesDetailCtrl'
      		},
      		'custom@cloudinary.resources': {
        		templateUrl: 'app/cloudinary/resources/custom/custom.html',
        		controller: 'CloudinaryResourcesCustomCtrl'
      		}
      	}
      })
      .state('cloudinary.url', {
        views: {
          'tab1': {},
          'tab3': {
            templateUrl: 'app/cloudinary/url/url.html',
            controller: 'CloudinaryUrlCtrl'
          }
        }
      });
  });