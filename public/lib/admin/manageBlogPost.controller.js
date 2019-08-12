angular
.module('BossApp')
.controller('addPostCtrl', addPostCtrl)
.controller('singlePostCtrl', singlePostCtrl)
.controller('editPostCtrl', editPostCtrl)
.controller('removepostCtrl', removepostCtrl)
.controller('adminAddjobCtrl', adminAddjobCtrl)
.controller('adminManagejobCtrl', adminManagejobCtrl)
.controller('addRemovejobCtrl', addRemovejobCtrl)
.controller('adminEditJobCtrl', adminEditJobCtrl);


function adminEditJobCtrl ($scope,$http,$route,$window,ngDialog) {
  
  $scope.editorConfig ={
        toolbar: [
      { name: 'basicStyling', items: ['bold', 'italic', 'strikethrough', 'subscript', 'superscript', '-', 'leftAlign','-'] },
      { name: 'paragraph', items: ['orderedList', 'unorderedList', 'outdent', 'indent', '-'] },
      { name: 'doers', items: ['removeFormatting', 'undo', 'redo', '-'] },
      { name: 'links', items: ['image', 'hr', 'symbols', 'link', 'unlink', '-'] },
      { name: 'styling', items: ['format'] },
        ]
    };
  
  $scope.job ={};
  $scope.submitted = false;
  $scope.login = "Edit job";
  $scope.edit = function(valid){
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
     var uploadUrl = "/manage/admin/editjob/"+$scope.job.id;
      $scope.formError = "";
      $scope.login = "Editing...";
     var fd = new FormData();
     for(var key in $scope.job)
        fd.append(key, $scope.job[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $scope.formSuccess = response.data.message;
        $scope.login = "Edit job";
    }, function (error) {
        $scope.formError = error.data.message;
        $scope.login = "Edit job";
    });
  };

   $scope.check = function(){
     if($scope.job.paymentType == "Negotiable" || $scope.job.paymentType == "Confidential" || $scope.job.paymentType == "" ){
      $scope.job.payment = null;
    }
  };
  

  $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  };
   
}

function addRemovejobCtrl ($scope,job,$http, $route,$window,ngDialog) {
  
  $scope.id = job.id;
  $scope.title = job.title;
  $scope.remove  = "Remove";

  $scope.removejob =  function(){
      $scope.remove = "Removing.....";
      $http.post('/manage/admin/removejob/'+$scope.id)
          .then(function (response) {    
              $window.location.href = "/manage/admin/manage-jobs";
          }, function (error) {
             $scope.remove  = "Remove";
          });
  }
  
}

function adminManagejobCtrl ($scope,$window,ngDialog) {

  $scope.adminSearch = "";
  $scope.adminSearchjob = function(search){
      $window.location.href = "/manage/admin/manage-jobs?search="+search;
  }; 
  
   $scope.removejob = function (id, title) {
        ngDialog.open({ 
          template: 'removejob', 
          controller: 'addRemovejobCtrl',
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

}

function adminAddjobCtrl ($scope,$http,$route,$window) {
    $scope.editorConfig ={
        toolbar: [
      { name: 'basicStyling', items: ['bold', 'italic', 'strikethrough', 'subscript', 'superscript', '-', 'leftAlign','-'] },
      { name: 'paragraph', items: ['orderedList', 'unorderedList', 'outdent', 'indent', '-'] },
      { name: 'doers', items: ['removeFormatting', 'undo', 'redo', '-'] },
      { name: 'links', items: ['symbols', 'link', 'unlink', '-'] },
      { name: 'styling', items: ['format'] },
        ]
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
     var uploadUrl = "/manage/admin/addjob";
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
        $window.location.href = "/manage/admin/manage-jobs";
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

function singlePostCtrl ($scope,$http,$window,$location,ngDialog) {
  
   $scope.btn = "Add comment";
  
   $scope.click = function(id){
      if( $scope.comment.name == null || $scope.comment.body == null){
          return;
      }
       $scope.btn = "Adding comment...";
       $http.post('/manage/admin/post/comment/'+id, $scope.comment)
          .then(function (response) {
             $window.location.href = "/manage/admin/blog-single-post/"+id;
          }, function (error) {
              $scope.btn = "Add comment";
          });
  }

   $scope.removepost = function (id, title) {
        ngDialog.open({ 
          template: 'removepost', 
          controller: 'removepostCtrl',
          className: 'ngdialog-theme-default',
          resolve : {
            post : function () {
              return {
                id : id,
                title: title
              };
            }
          }
        });
    };
}

function removepostCtrl ($scope,post,$http,$window,ngDialog) {
  
  $scope.id = post.id;
  $scope.title = post.title;
  $scope.remove  = "Remove";

  $scope.removepost =  function(){
      $scope.remove = "Removing.....";
      $http.post('/manage/admin/remove-post/'+$scope.id)
          .then(function (response) {    
              $window.location.href = "/manage/admin/manage-blog";
          }, function (error) {
             $scope.remove  = "Remove";
          });
  }
  
}

function addPostCtrl ($scope,Upload,$http,$window,$location) {
  
    $scope.post ={};
   $scope.create = function () {  
    if(!$scope.post.subject || !$scope.post.message || !$scope.post.file ){
         $scope.formError = "All field are required";
         return;
    }
        $scope.upload();
    };


 $scope.upload = function(){
     var uploadUrl = "/manage/admin/add-blog-post";
      $scope.formError = "";
     var fd = new FormData();
     for(var key in $scope.post)
        fd.append(key, $scope.post[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $window.location.href = "/manage/admin/manage-blog";
    }, function (error) {
        $scope.formError = error.data.message;
         $scope.formSuccess = "";
    });
  };

  $scope.clear = function(){
    $scope.formSuccess="";
    $scope.formError = "";
  }
  
}

function editPostCtrl ($scope,$http,$window,$location) {

  $scope.post ={};
 
 $scope.update = function(postId){
   if(!$scope.post.subject || !$scope.post.message){
         $scope.formError = "All field are required";
         return;
    }
      var uploadUrl = "/manage/admin/edit-blog-post/"+postId;
      $scope.formError = "";
     var fd = new FormData();
     for(var key in $scope.post)
        fd.append(key, $scope.post[key]);
     $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
     }).then(function (response) {
        $window.location.href = "/manage/admin/blog-single-post/"+postId;
    }, function (error) {
        $scope.formError = error.data.message;
         $scope.formSuccess = "";
    });
  };


  $scope.clear = function(){
    $scope.formSuccess="";
    $scope.formError = "";
  }
  
}


