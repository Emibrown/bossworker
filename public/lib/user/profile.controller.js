angular
.module('eApp')
.controller('profileCtrl', profileCtrl);

function profileCtrl ($scope,$http,socket,$route,$window,ngToast) {
	$scope.profile = {};
	 $scope.update = function(){
           var uploadUrl = "/student/profile";
           var fd = new FormData();
           for(var key in $scope.profile)
           		fd.append(key, $scope.profile[key]);
           $http.post(uploadUrl, fd, {
              transformRequest: angular.identity,
              headers: {'Content-Type': undefined}
           }).then(function (response) {
                ngToast.create({
                  className: 'success',
                  content: 'Profile updated!'
                });
                $scope.loading = false;
                 setTimeout(function(){
                     $window.location.href = "/student/profile";
                }, 3000);
          }, function (error) {
               ngToast.create({
                  className: 'danger',
                  content: error.data
                });
                $scope.loading = false;
          });
        };

  socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
  });
  
}