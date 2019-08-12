(function () {

angular
.module('BossApp')
.controller('registerCtrl', registerCtrl)
.controller('successSignup', successSignup);

registerCtrl.$inject = ['$scope','$http','$route','$window','$location','ngDialog'];
successSignup.$inject = ['$scope','user'];

function successSignup ($scope,user){

  $scope.fullname = user.fullname;

}

function registerCtrl ($scope,$http,$route,$window,$location,ngDialog) {
	$scope.credentials = {
		  firstname: "",
      lastname: "",
	    emailphone: "",
	    password1: "",
	    password2: ""
	  };

    $scope.register = 'Register';

     $scope.popUp = function (firstname, lastname) {
          ngDialog.open({ 
            template: 'successPop', 
            controller: 'successSignup',
            className: 'ngdialog-theme-default',
            closeByDocument: false,
            closeByEscape: false,
            resolve : {
              user : function () {
                return {
                  fullname : firstname+' '+lastname,
                };
              }
            }
          });
      };

	  function userRegister(){
      $scope.register = 'Register';
      $http.post('/user/register', $scope.credentials)
          .then(function (response) {
              $scope.popUp(response.data.firstname,response.data.lastname);
              $scope.register = 'Processing...';
          }, function (error) {
              $scope.formError = error.data.message;
              $scope.register = 'Register';
          });
  }
  $scope.onSubmit = function(formvalid){
    if(formvalid){
        userRegister();
    }
  }; 
  $scope.clear = function(){
    $scope.formError = "";
  };
	 
}

})();