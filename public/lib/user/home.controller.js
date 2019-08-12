(function () {

angular
.module('BossApp')
.controller('homeCtrl', homeCtrl)
.controller('getCraditCtrl', getCraditCtrl);


homeCtrl.$inject = ['$scope','$http','$route','$window','ngDialog'];
getCraditCtrl.$inject = ['$scope','$http','$route','$window','ngDialog'];


function homeCtrl ($scope,$http,$route,$window,ngDialog) {

	$scope.cradit = function () {
        ngDialog.open({ 
          template: 'getGradit', 
          controller: 'getCraditCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
        });
    };
	
}

function getCraditCtrl ($scope,$http,$route,$window,ngDialog) {
  
  $scope.value = 100;
  $scope.button  = "Make payment";

  

     $scope.pay = function (valid) {
       if(!valid){
          $scope.formError = "Enter a valid amount";
          return;
        }
        $scope.credentials = {
          amount: $scope.value*100
        }
        $scope.clear();
        $scope.button  = "Sending...";
         $http.post('/user/pay',$scope.credentials)
          .then(function (response) {
              $window.location.href = response.data.message;
          }, function (error) {
              $scope.button  = "Make payment";
              $scope.formError = error.data.message;
          });
    };

    $scope.clear = function(){
      $scope.formError = "";
    };

}

})();