angular
.module('BossApp')
.directive('loading', loading);

function loading () {
   return {
        restrict: 'E',
        replace:true,
        template: '<img src="http://www.nasa.gov/multimedia/videogallery/ajax-loader.gif" width="25" height="25" />',
        link: function (scope, element, attr) {
              scope.$watch('loading', function (val) {
                  if (val)
                      $(element).show();
                  else
                      $(element).hide();
              });
        }
      }
}