(function () {

angular
.module('BossApp')
.controller('browsejobCtrl', browsejobCtrl)
.controller('browseresumeCtrl', browseresumeCtrl)
.controller('browseBlogCtrl', browseBlogCtrl);

browsejobCtrl.$inject = ['$scope','$http','$route','$window','$location'];
browseresumeCtrl.$inject = ['$scope','$http','$route','$window','$location'];
browseBlogCtrl.$inject = ['$scope','$http','$route','$window','$location'];

function browsejobCtrl ($scope,$http,$route,$window,$location) {
  $scope.search = "";
  $scope.searchjob = function(search){
      $window.location.href = "/user/jobs?search="+search;
  }; 
}

function browseresumeCtrl ($scope,$http,$route,$window,$location) {
  $scope.search = "";
  $scope.searchresume = function(search){
      $window.location.href = "/user/Freelancers?search="+search;
  }; 
}

function browseBlogCtrl ($scope,$http,$route,$window,$location) {
  $scope.search = "";
  $scope.searchBlog = function(search){
      $window.location.href = "/user/blog?search="+search;
  }; 
}

})();