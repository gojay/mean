'use strict';

angular.module('exampleAppApp')
  .config(function ($stateProvider) {

    /**
     * Object based states
     * @see https://github.com/angular-ui/ui-router/wiki/Nested-States-%26-Nested-Views#object-based-states
     */
    function getStateObject ( parent ) {
      // define state names
      var stateName = {
        modal: parent + '.modal',
        upload: parent + '.upload',
        resources: parent + '.resources',
        url: parent + '.url'
      };

      // set resource views
      var resourceViews = {
        'tab2@': {
          templateUrl: 'app/cloudinary/resources/resources.html',
        }
      };
      resourceViews['list@' + stateName.resources] = {
        templateUrl: 'app/cloudinary/resources/list/list.html',
        controller: 'CloudinaryResourcesListCtrl'
      };
      resourceViews['detail@' + stateName.resources] = {
        templateUrl: 'app/cloudinary/resources/detail/detail.html',
        controller: 'CloudinaryResourcesDetailCtrl'
      };
      resourceViews['custom@' + stateName.resources] = {
        templateUrl: 'app/cloudinary/resources/custom/custom.html',
        controller: 'CloudinaryResourcesCustomCtrl'
      };

      return {
        // cloudinary modal parent
        modal: {
          name: stateName.modal,
          parent: parent,
          onEnter: ['$modal', '$state', function($modal, $state) {
            console.log('open', $state.current.name);
            var modalInstance = $modal.open({
              templateUrl: 'app/cloudinary/index/cloudinary-modal.html',
              controller: 'CloudinaryCtrl',
              resolve: {
                model: function() { return parent }
              },
              backdrop: 'static',
              windowClass: 'xxl',
            });
            modalInstance.result.finally(function() {
              console.log('close', $state.current.name);
              modalInstance.isClosed = true;
              $state.go(parent);
            });
          }],
          onExit: function($state) {
            console.log('exit', $state.current.name);
          }
        },
        // cloudinary upload
        upload: {
          name: stateName.upload,
          parent: stateName.modal,
          views: {
            'tab1@': {
              templateUrl: 'app/cloudinary/upload/upload.html',
              controller: 'CloudinaryUploadCtrl'
            }
          }
        },
        // cloudinary list/detail/custom resources
        resources: {
          name: stateName.resources,
          parent: stateName.modal,
          views: resourceViews
        },
        // cloudinary url
        url: {
          name: stateName.url,
          parent: stateName.modal,
          views: {
            'tab3@': {
              templateUrl: 'app/cloudinary/url/url.html',
              controller: 'CloudinaryUrlCtrl'
            }
          }
        }
      };
    }

    $stateProvider
      .state('example', {
        url: '/example',
        template: [ 
          '<div class="container margin-top-bottom"><div class="row"><div class="col-lg-12">',
          '<p><a class="btn btn-default" ui-sref="example.upload">Modal</a></p>',
          '<p><button class="btn btn-info" ng-click="showAlert(\'info\')">Alert info</button></p>',
          '<p><button class="btn btn-primary" ng-click="showAlert(\'primary\')">Alert primary</button></p>',
          '<p><button class="btn btn-success" ng-click="showAlert(\'success\')">Alert success</button></p>',
          '<p><button class="btn btn-danger" ng-click="showAlert(\'danger\')">Alert danger</button></p>',
          '<div class="row">',
            '<div class="col-lg-12">',
              '<h2>Bootstrap WYSIHTML 5</h2>',
              '<textarea ui-tinymce="tinymceOptions" ng-model="text"></textarea>',
              '<pre>{{text}}</pre>',
            '</div>',
          '</div>',
          '<div class="row" ng-show="selected">',
            '<div class="col-sm-6 col-md-4" ng-repeat="select in selected">',
              '<div class="thumbnail">',
                '<img ng-src="{{select.url}}" alt="{{select.context.alt}}">',
                '<div class="caption">',
                  '<h3>{{select.context.caption}}</h3>',
                  '<p>{{select.context.description}}</p>',
                '</div>',
            '</div>',
          '</div>',
          '</div></div></div>'
        ].join(''),
        controller: function($scope, CloudinaryService, ngToast){
          $scope.$on('cloudinary:onselected:image', function(event, url){
            $scope.selected = url;
          });

          $scope.text = '<h1><a href="http://generator.lorem-ipsum.info/" data-mce-href="http://generator.lorem-ipsum.info/">lorem ipsim</a></h1><p><img src="https://jptacek.com/2013/10/angularjs-introducing-ng-repeat/angularLogo.png" alt="" width="359" height="110" data-mce-src="https://jptacek.com/2013/10/angularjs-introducing-ng-repeat/angularLogo.png" style="float: right;" data-mce-style="float: right;">Lorem ipsum dolor sit amet, menandri prodesset est ne, nec ad consul propriae repudiandae, omnis efficiantur est ei. Harum appareat dignissim eu has, ei persius sapientem scribentur pro. Pro no suas quidam epicurei. Mutat ornatus te sit, liber definitionem quo ex.</p><p>Ad quo brute copiosae quaestio. Modus graece iriure eos an. Ei usu affert ignota erroribus, ei choro definitiones nec. Per liber lucilius perpetua ne. Laudem corpora abhorreant eu sed.</p><p><br></p><p>Ut vix probo postulant, qui cu tota tibique temporibus. At eam minim verear similique, per at ornatus repudiare tincidunt. Sea id intellegat dissentiunt, has in ipsum option erroribus, et vide reprehendunt mei. Placerat senserit scribentur ne sit, odio corrumpit efficiendi vel in, idque viderer minimum duo at.</p><p><br></p><p>Semper epicurei eloquentiam ea nec, ignota officiis ne quo. Ea eum sint tacimates, idque meliore gubergren quo in. Eos at liber ubique aliquip. Facilisi pertinax dissentias eos et, ad torquatos similique per. Ea sed mollis blandit. Vidit scripserit ea sit, quem primis vidisse pri ne. Sale facilisis eum te, sea idque dicit sonet at.</p><p><br></p><p>At noster adversarium nec, qui et primis noster pericula, legimus quaestio vel in. Ei per meis evertitur, qui veri partem in. Oratio urbanitas id vim. Sit vitae iracundia cu, mel ceteros volumus gloriatur ad, eum novum nominati definitionem no. Id sea esse diceret ornatus, his cu nobis detraxit inciderint. No tantas qualisque prodesset qui, ad delectus patrioque pri.</p>';
          $scope.tinymceOptions = {
            onChange: function(e) {
              console.log('tiny:mce:onChange', e);
            },
            inline: false,
            plugins : 'advlist autolink link image lists charmap print preview pagebreak fullscreen media insertdatetime wordcount',
            skin: 'lightgray',
            theme : 'modern'
          };

          $scope.showAlert = function(className) {
            ngToast.create({
              content: '<i class="fa fa-exclamation-circle fa-2x"></i> Another message',
              className: className || 'success',
              timeout: 1000
            });
          }
        }
      })
        .state(getStateObject('example').modal)
        .state(getStateObject('example').upload)
        .state(getStateObject('example').resources)
        .state(getStateObject('example').url)

      .state('another', {
        url: '/another',
        template: [ 
          '<div class="container margin-top-bottom"><div class="row"><div class="col-lg-12">',
          '<p><a class="btn btn-default" ui-sref="another.upload">Modal</a></p>',
          '<div class="row" ng-show="selected">',
            '<div class="col-sm-6 col-md-4" ng-repeat="select in selected">',
              '<div class="thumbnail">',
                '<img ng-src="{{select.url}}" alt="{{select.context.alt}}">',
                '<div class="caption">',
                  '<h3>{{select.context.caption}}</h3>',
                  '<p>{{select.context.description}}</p>',
                '</div>',
            '</div>',
          '</div>',
          '</div></div></div>'
        ].join(''),
        controller: function($scope, CloudinaryService, ngToast){
          $scope.$on('cloudinary:onselected:image', function(event, url){
            $scope.selected = url;
          });

          $scope.showAlert = function(className) {
            ngToast.create({
              content: '<i class="fa fa-exclamation-circle fa-2x"></i> Another message',
              className: className || 'success',
              timeout: 1000
            });
          }
        }
      })
        .state(getStateObject('another').modal)
        .state(getStateObject('another').upload)
        .state(getStateObject('another').resources)
        .state(getStateObject('another').url);

    /*$stateProvider
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
        		templateUrl: 'app/cloudinary/resources/resources.html'
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
      });*/
  });