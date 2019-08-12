(function () {

angular
.module('BossApp')
.controller('editJobCtrl', editJobCtrl);

editJobCtrl.$inject = ['$scope','$http','$route','$window','ngDialog'];


function editJobCtrl ($scope,$http,$route,$window,ngDialog) {
  
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
     var uploadUrl = "/user/editjob/"+$scope.job.id;
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
     if($scope.job.paymentType == "Negotiable" || $scope.job.paymentType == "" ){
      $scope.job.payment = null;
    }
  };
  

  $scope.clear = function(){
    $scope.formError = "";
    $scope.formSuccess = "";
  };
   
}

})();