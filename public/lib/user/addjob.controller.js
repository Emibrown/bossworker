(function () {

angular
.module('BossApp')
.controller('addjobCtrl', addjobCtrl)
.controller('postjobCtrl', postjobCtrl)
.controller('profileCtrl', profileCtrl);

postjobCtrl.$inject = ['$scope','job','$http','$route','$window','ngDialog'];
addjobCtrl.$inject = ['$scope','$http','$route','$window','ngDialog'];
profileCtrl.$inject = ['$scope','Upload','$window','$http'];

function profileCtrl ($scope,Upload,$window,$http) {

  $scope.profile ={};
  $scope.btn = "Edit";
  $scope.Pbtn = "Change";
   $scope.edit = function (valid) {  
    if(!valid){
         $scope.formError = "All field are required";
         return;
    }
        $scope.update();
    };

     $scope.change = function (valid) {  
      if(!valid){
           $scope.passError = "Fill the form properly!";
           return;
      }
          $scope.changePassword();
      };

    $scope.changePassword = function(){
      $scope.Pbtn = "Changing...";
      $scope.Pclear();
      $http.post('/user/changePassword', $scope.password)
      .then(function (response) {
           $scope.passSuccess = response.data.message;
           $scope.Pbtn = "Change";
      }, function (error) {
            $scope.passError = error.data.message;
            $scope.Pbtn = "Change";
      });
    }

 $scope.update = function(){
     $scope.btn = "Editting...";
     $scope.clear();
     $scope.clear();
     var uploadUrl = "/user/profile";
      $scope.formError = "";
     var fd = new FormData();
     for(var key in $scope.profile)
        fd.append(key, $scope.profile[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $window.location.href = "/user/profile";
    }, function (error) {
        $scope.formError = error.data.message;
         $scope.formSuccess = "";
        $scope.btn = "Edit";
    });
  };

  $scope.clear = function(){
    $scope.formError = "";
  }
  $scope.Pclear = function(){
    $scope.passSuccess="";
    $scope.passError = "";
  }
}


function postjobCtrl ($scope,job,$http,$route,$window,ngDialog) {
  $scope.jobId = job.jobId;
  $scope.price = 1;
  $scope.message ="";
  $scope.button = "Post Job";
  

  $scope.check = function(currentCredit){
    if( $scope.price*100 > currentCredit){
        $scope.message ="You dont have credit to post this job";
        $scope.button = "Get Credit";
    }else{
        $scope.message ="";
        $scope.button = "Post Job";
    }
  };

  $scope.postjob = function(currentCredit){
      if( $scope.price*100 > currentCredit){
          ngDialog.open({ 
            template: 'getGradit', 
            controller: 'getCraditCtrl',
            className: 'ngdialog-theme-default',
            closeByDocument: false,
            closeByEscape: false,
          });
          $scope.closeThisDialog('Some value');
      }
      if( $scope.price == null){
          return;
      }
      if( $scope.price*100 > currentCredit){
         
      }else{
          $scope.button = "Posting....";
          $http.post('/user/post-job/'+$scope.jobId+'/'+$scope.price)
          .then(function (response) {    
              $window.location.href = "/user/manage-jobs";
          }, function (error) {
             $scope.button  = "Post Job";
          });
      }
  };




}

function addjobCtrl ($scope,$http,$route,$window,ngDialog) {
    $scope.editorConfig ={
        toolbar: [
      { name: 'basicStyling', items: ['bold', 'italic', 'strikethrough', 'subscript', 'superscript', '-', 'leftAlign','-'] },
      { name: 'paragraph', items: ['orderedList', 'unorderedList', 'outdent', 'indent', '-'] },
      { name: 'doers', items: ['removeFormatting', 'undo', 'redo', '-'] },
      { name: 'links', items: ['symbols', 'link', 'unlink', '-'] },
      { name: 'styling', items: ['format'] },
        ]
    };

   $scope.postjob = function (jobId) {
        ngDialog.open({ 
          template: 'postjob', 
          controller: 'postjobCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
          preCloseCallback: function(value) {
              $window.location.href = "/user/manage-jobs";
              return true;
          },
          resolve : {
            job : function () {
              return {
                jobId : jobId
              };
            }
          }
        });
    };

  $scope.job ={};
  $scope.submitted = false;
  $scope.login = "Post job";
  $scope.create = function(valid){
    $scope.submitted = true;
    $scope.check();
    $scope.clear();
    if(!valid){
      $scope.formError = "Fill all the required fields properly.";
      return;
    }
    if($scope.job.aboutJob == null){
      $scope.formError = "Enter datails about this job in the 'About job' field.";
      return;
    }
     var uploadUrl = "/user/addjob";
      $scope.formError = "";
      $scope.login = "Posting...";
     var fd = new FormData();
     for(var key in $scope.job)
        fd.append(key, $scope.job[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $scope.formSuccess = response.data.message;
        $scope.login = "Post job";
        $scope.postjob(response.data.jobId);
    }, function (error) {
        $scope.formError = error.data.message;
        $scope.login = "Post job";
    });
  };

  $scope.check = function(){
     if($scope.job.paymentType == "Negotiable" && $scope.job.paymentType == "" ){
      $scope.job.payment = null;
    }
  };
  

  $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  };
 
}

})();