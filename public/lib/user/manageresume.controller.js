(function () {

angular
.module('BossApp')
.controller('addresumeCtrl', addresumeCtrl)
.controller('manageresumeCtrl', manageresumeCtrl)
.controller('removeresumeCtrl', removeresumeCtrl)
.controller('editresumeCtrl', editresumeCtrl)
.controller('postresumeCtrl', postresumeCtrl);

addresumeCtrl.$inject = ['$scope','ngDialog','$http','$route','$window'];
removeresumeCtrl.$inject = ['$scope','resume','$http', '$route','$window','ngDialog'];
editresumeCtrl.$inject = ['$scope','$http'];
manageresumeCtrl.$inject = ['$scope','ngDialog'];
postresumeCtrl.$inject = ['$scope','resume','$http','$route','$window','ngDialog'];


function postresumeCtrl ($scope,resume,$http,$route,$window,ngDialog) {
  $scope.resumeId = resume.resumeId;
  $scope.price = 1;
  $scope.message ="";
  $scope.button = "Post Freelance";
  

  $scope.check = function(currentCredit){
    if( $scope.price*100 > currentCredit){
        $scope.message ="You dont have credit to post this freelance";
        $scope.button = "Get Credit";
    }else{
        $scope.message ="";
        $scope.button = "Post Freelance";
    }
  };

  $scope.postresume = function(currentCredit){
      if( $scope.price == null){
          return;
      }
      if( $scope.price*100 > currentCredit){
         
      }else{
          $scope.button = "Posting....";
          $http.post('/user/post-resume/'+$scope.resumeId+'/'+$scope.price)
          .then(function (response) {    
              $window.location.href = "/user/manage-freelance";
          }, function (error) {
             $scope.button  = "Post Freelance";
          });
      }
  };
}


function addresumeCtrl ($scope,ngDialog,$http,$route,$window) {
   $scope.editorConfig ={
        toolbar: [
      { name: 'basicStyling', items: ['bold', 'italic', 'strikethrough', 'subscript', 'superscript', '-', 'leftAlign','-'] },
      { name: 'paragraph', items: ['orderedList', 'unorderedList', 'outdent', 'indent', '-'] },
      { name: 'doers', items: ['removeFormatting', 'undo', 'redo', '-'] },
      { name: 'links', items: ['symbols', 'link', 'unlink', '-'] },
      { name: 'styling', items: ['format'] },
        ]
    };

  $scope.resume = {};
  $scope.educations = [];
  $scope.experiences = [];
  $scope.btn = "Post Freelance";
  $scope.submitted = false;

  var year = new Date().getFullYear();
  var range = [];
  for (var i = 0; i < 30; i++) {
      range.push(year - i);
  }
  $scope.years = range;
  
  $scope.resume.educations = $scope.educations;
  $scope.resume.experiences = $scope.experiences;
  $scope.addNewEducation = function() {
    $scope.educations.push({});
  };

  $scope.addNewExperience = function() {
    $scope.experiences.push({});
  };
    
  $scope.removeEducation = function(index) {
    $scope.educations.splice(index, 1);
  };

  $scope.removeExperience = function(index) {
    $scope.experiences.splice(index, 1);
  };

  $scope.postresume = function (resumeId) {
        ngDialog.open({ 
          template: 'postresume', 
          controller: 'postresumeCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
          preCloseCallback: function(value) {
              $window.location.href = "/user/manage-freelance";
              return true;
          },
          resolve : {
            resume : function () {
              return {
                resumeId : resumeId
              };
            }
          }
        });
    };

   
    // function to submit the form after all validation has occurred            
 
    // Post data and selected files.  
    $scope.save = function (isValid) {  
    $scope.submitted = true;
    $scope.clear();
    $scope.check();
    if (!isValid) {
      $scope.formError = "Fill all the required fields properly";
      return;
    }
    if($scope.resume.aboutMe == null){
      $scope.formError = "Enter your About Me / Professional Summary.";
      return;
    }
      $scope.btn = "Posting...";
      var uploadUrl = "/user/add-resume";
      $http.post(uploadUrl, $scope.resume)
      .then(function (response) {
         $scope.btn = "Post freelance";
         $scope.formSuccess = response.data.message;
         $scope.postresume(response.data.resumeId);
      }, function (error) {
         $scope.btn = "Post freelance";
         $scope.formError = error.data.message;
      });
    };

    $scope.check = function(){
     if($scope.resume.paymentType == "Negotiable" || $scope.resume.paymentType == "" ){
      $scope.resume.payment = null;
    }
  };
  

  $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  };
  
}


function editresumeCtrl ($scope,$http) {
  
  $scope.resume = {};
  $scope.educations = [];
  $scope.experiences = [];
  $scope.btn = "Post freelance";
  
  var year = new Date().getFullYear();
  var range = [];
  for (var i = 0; i < 30; i++) {
      range.push(year - i);
  }
  $scope.years = range;
 
  $scope.addNewEducation = function() {
    $scope.educations.push({});
  };

  $scope.addNewExperience = function() {
    $scope.experiences.push({});
  };
    
  $scope.removeEducation = function(index) {
    $scope.educations.splice(index, 1);
  };

  $scope.removeExperience = function(index) {
    $scope.experiences.splice(index, 1);
  };

   
    // Post data and selected files.  
    $scope.save = function (isValid,id) {  
      $scope.resume.educations = $scope.educations;
      $scope.resume.experiences = $scope.experiences;
      $scope.submitted = true;
      $scope.clear();
      $scope.check();
      if (!isValid) {
        $scope.formError = "Fill all the required fields properly";
        return;
      }
      if($scope.resume.aboutMe == null){
        $scope.formError = "Enter About Me / Professional Summary.";
        return;
      }
      $scope.btn = "Posting...";
      var uploadUrl = "/user/editresume/"+id;
      $http.post(uploadUrl, $scope.resume).then(function (response) {
         $scope.btn = "Post freelance";
         $scope.formSuccess = response.data.message;
      }, function (error) {
         $scope.btn = "Post freelance";
         $scope.formError = error.data.message;
      });
    };  

    
    $scope.check = function(){
       if($scope.resume.paymentType == "Negotiable" || $scope.resume.paymentType == "" ){
        $scope.resume.payment = "";
      }
    };
  

  $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  };
  
}

function manageresumeCtrl ($scope,ngDialog) {
  console.log("working");
   $scope.removeresume = function (id, title) {
        ngDialog.open({ 
          template: 'removeresume', 
          controller: 'removeresumeCtrl',
          className: 'ngdialog-theme-default',
          resolve : {
            resume : function () {
              return {
                id : id,
                title: title
              };
            }
          }
        });
    };

     $scope.postresume = function (resumeId) {
        ngDialog.open({ 
          template: 'postresume', 
          controller: 'postresumeCtrl',
          className: 'ngdialog-theme-default',
          closeByDocument: false,
          closeByEscape: false,
          resolve : {
            resume : function () {
              return {
                resumeId : resumeId
              };
            }
          }
        });
    };
    
}

function removeresumeCtrl ($scope,resume,$http, $route,$window,ngDialog) {
  
  $scope.id = resume.id;
  $scope.title = resume.title;
  $scope.remove  = "Remove";

  $scope.removeresume =  function(){
      $scope.remove = "Removing.....";
      $http.post('/user/removeresume/'+$scope.id)
          .then(function (response) {    
              $window.location.href = "/user/manage-freelance";
          }, function (error) {
             $scope.remove  = "Remove";
          });
  }
  
}

})();
