angular
.module('BossApp')
.controller('adminloginCtrl', adminloginCtrl);

function adminloginCtrl ($scope,$http,$route,$window,$location) {
	 $scope.credentials = {
    email: "",
    password: ""
  };
  $scope.login = "Login";

 function userlogin(){
      $http.post('/manage/admin/login', $scope.credentials)
          .then(function (response) {
              $window.location.href = "/manage/admin/dashboard";
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
}