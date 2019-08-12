(function () {
angular.module('BossApp', ['ngRoute','ngAnimate','ngSanitize','localytics.directives','ngDialog','ngFileUpload','ngWYSIWYG']);
   angular
	.module('BossApp')
	.directive('fileModel', ['$parse', function ($parse) {
        return {
           restrict: 'A',
           link: function(scope, element, attrs) {
              var model = $parse(attrs.fileModel);
              var modelSetter = model.assign;
              element.bind('change', function(){
                 scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                 });
              });
           }
        };
     }]);
   angular
  .module('BossApp')
  .directive('uploadFiles', ['$parse', function ($parse) {
        return {  
            scope: true,        //create a new scope  
            link: function (scope, el, attrs) {  
                el.bind('change', function (event) {  
                    var files = event.target.files;  
                    //iterate files since 'multiple' may be specified on the element  
                    for (var i = 0; i < files.length; i++) {  
                        //emit event upward  
                        scope.$emit("seletedFile", { file: files[i] });  
                    }  
                });  
            }  
        }; 
      }]);
   angular
  .module('BossApp')
  .directive('onlyNum', function() {
      return function(scope, element, attrs) {

          var keyCode = [8, 9, 37, 39, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110];
          element.bind("keydown", function(event) {
              //console.log($.inArray(event.which,keyCode));
              if ($.inArray(event.which, keyCode) === -1) {
                  scope.$apply(function() {
                      scope.$eval(attrs.onlyNum);
                      event.preventDefault();
                  });
                  event.preventDefault();
              }

          });
      };
  });
   angular
	.module('BossApp')
	.service('fileUpload', ['$http','$route','$window','ngToast', function ($http,$route,$window,ngToast) {
        this.uploadFileToUrl = function(file, uploadUrl){
           var fd = new FormData();
           for(var key in file)
           		fd.append(key, file[key]);
           $http.post(uploadUrl, fd, {
              transformRequest: angular.identity,
              headers: {'Content-Type': undefined}
           });
        }
     }]);
  angular
  .module('BossApp')
  .factory('socket', socket);
  function socket ($rootScope) {
      var socket = io.connect('http://192.168.137.1:3000');
        return {
          on: function(eventName, callback){
            socket.on(eventName, callback);
          },
          emit: function(eventName, data) {
            socket.emit(eventName, data);
          }
        };
  }

  })();