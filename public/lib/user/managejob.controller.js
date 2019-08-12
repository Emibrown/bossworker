(function () {

angular
.module('BossApp')
.controller('managejobCtrl', managejobCtrl)
.controller('removejobCtrl', removejobCtrl)
.controller('applyjobCtrl', applyjobCtrl)
.controller('sendAppCtrl', sendAppCtrl)
.controller('blogCtrl', blogCtrl);

managejobCtrl.$inject = ['$scope','ngDialog'];
removejobCtrl.$inject = ['$scope','job','$http', '$route','$window','ngDialog'];
applyjobCtrl.$inject = ['$scope','ngDialog'];
sendAppCtrl.$inject = ['$scope', 'applyJob', '$http', '$route','$window','ngDialog'];
blogCtrl.$inject = ['$scope','$http','$window','$location'];


function blogCtrl ($scope,$http,$window,$location) {
  
   $scope.btn = "Add comment";
  
   $scope.click = function(postId){
      if( $scope.comment.name == null || $scope.comment.body == null){
          return;
      }
       $scope.btn = "Adding comment...";
       $http.post('/user/post/comment/'+postId, $scope.comment)
          .then(function (response) {
             $window.location.href = "/user/blog/"+postId;
          }, function (error) {
              $scope.btn = "Add comment";
          });
  }

}

function managejobCtrl ($scope,ngDialog) {

  $scope.adminSearch = "";
  $scope.adminSearchjob = function(search){
      $window.location.href = "/admin/manage-jobs?search="+search;
  }; 
  
   $scope.removejob = function (id, title) {
        ngDialog.open({ 
          template: 'removejob', 
          controller: 'removejobCtrl',
          className: 'ngdialog-theme-default',
          resolve : {
            job : function () {
              return {
                id : id,
                title: title
              };
            }
          }
        });
    };

     $scope.postjob = function (jobId) {
        ngDialog.open({ 
          template: 'postjob', 
          controller: 'postjobCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
          resolve : {
            job : function () {
              return {
                jobId : jobId
              };
            }
          }
        });
    };
    
}

function applyjobCtrl ($scope,ngDialog) {
  $scope.applyjob = function (jobId) {
        ngDialog.open({ 
          template: 'applyforjob', 
          controller: 'sendAppCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
          resolve : {
            applyJob : function () {
              return {
                jobId : jobId
              };
            }
          }
        });
    };
}

function sendAppCtrl ($scope, applyJob, $http, $route,$window,ngDialog) {
  $scope.id = applyJob.jobId;
  $scope.app ={};
  $scope.send = "Send application";
 
  $scope.sendApp = function(isValid){
    $scope.submitted = true;
    $scope.clear();
    if(!isValid){
      return;
    }
     var uploadUrl = "/user/applyjob/"+ $scope.id;
      $scope.formError = "";
      $scope.send = "Sending...";
     var fd = new FormData();
     for(var key in $scope.app)
        fd.append(key, $scope.app[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $scope.formSuccess = response.data.message;
        $scope.send = "Send application";
        $window.location.reload();
    }, function (error) {
        $scope.formError = error.data.message;
        $scope.send = "Send application";
    });
  };

   $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  }
}

function removejobCtrl ($scope,job,$http, $route,$window,ngDialog) {
  
  $scope.id = job.id;
  $scope.title = job.title;
  $scope.remove  = "Remove";

  $scope.removejob =  function(){
      $scope.remove = "Removing.....";
      $http.post('/user/removejob/'+$scope.id)
          .then(function (response) {    
              $window.location.href = "/user/manage-jobs";
          }, function (error) {
             $scope.remove  = "Remove";
          });
  }
  
}

})();