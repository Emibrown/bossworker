(function () {

angular
.module('BossApp')
.controller('loginCtrl', loginCtrl)
.controller('forgetPassword', forgetPassword)
.controller('resetPassCtrl', resetPassCtrl);


loginCtrl.$inject = ['$scope','$http','$route','$window','$location','ngDialog'];
forgetPassword.$inject = ['$scope','$http'];
resetPassCtrl.$inject = ['$scope','$http','$route','$window','$location'];


function loginCtrl ($scope,$http,$route,$window,$location,ngDialog) {
  $scope.credentials = {
    emailphone: "",
    password: ""
  };
  $scope.login = "Login";

 function userlogin(){
      $http.post('/user/login', $scope.credentials)
          .then(function (response) {
              if(response.data.redirectUrl ){
                $window.location.href = "/user"+response.data.redirectUrl;
              }else{
                $window.location.href = "/user";
              }
          }, function (error) {
              $scope.formError = error.data.message;
              $scope.login = "Login";
              $scope.showbtn = false;
          });
  }
  $scope.onSubmit = function(){
      $scope.formError = "";
      $scope.login = "Logining....";
      $scope.showbtn = true;
      userlogin();
  }; 
  $scope.clear = function(){
    $scope.formError = "";
  };

  $scope.forgetPassword = function () {
        ngDialog.open({ 
          template: 'forgetPassword', 
          controller: 'forgetPassword',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
        });
    };

    $scope.passReset = function (isValid) {
      if(!isValid){
        return;
      } 
    };

}

function forgetPassword ($scope,$http) {
  
    $scope.button = "Reset Password";
    $scope.submitted = false;

    $scope.reset = function(isValid){
      $scope.clear();
      if(!isValid){
         $scope.submitted = true;
         return;
      }
      $scope.button = "Sending...";
      $http.post('/user/forget', $scope.credentials)
        .then(function (response) {
            $scope.formSuccess = response.data.message;
            $scope.button = "Reset Password";
            $scope.credentials.email = "";
            $scope.submitted = false;
        }, function (error) {
            $scope.formError = error.data.message;
            $scope.button = "Reset Password";
        });


    }

    $scope.clear = function(){
      $scope.formError = "";
      $scope.formSuccess = "";
    };
}

function resetPassCtrl ($scope,$http,$route,$window,$location) {
  
    $scope.button = "Reset Password";
    $scope.submitted = false;

    $scope.passReset = function(isValid){
      $scope.clear();
      if(!isValid){
         $scope.submitted = true;
         return;
      }
      $scope.button = "Sending...";
      $http.post('/user/reset/'+$scope.token, $scope.credentials)
        .then(function (response) {
            $scope.formSuccess = response.data.message;
            $scope.button = "Reset Password";
            $window.location.href = "/user";
        }, function (error) {
            $scope.formError = error.data.message;
            $scope.button = "Reset Password";
        });


    }

    $scope.clear = function(){
      $scope.formError = "";
      $scope.formSuccess = "";
    };
}

})();