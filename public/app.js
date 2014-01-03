var app = angular.module('pom', []);

app.controller('MainCtrl', function($scope) {
  $scope.startChatting = function() {
    $scope.mode = 'chatting';
  };
});

app.controller('ChatCtrl', function($scope, socket) {
  $scope.messages = [];

  socket.on('entrance', function(data) {
    $scope.messages.push({
      type: 'system',
      text: data.message
    });
  });

  socket.on('waiting', function(data) {
    $scope.messages.push({
      type: 'system',
      text: data.message
    });
  });

  socket.on('ready', function(data) {
    $scope.messages.push({
      type: 'system',
      text: data.message
    });
  });

  socket.on('exit', function(data) {
    $scope.messages.push({
      type: 'leave',
      text: data.message
    });
  });

  socket.on('chat', function(data) {
    $scope.messages.push({
      type: 'normal',
      text: data.message
    });
  });

  $scope.sendMessage = function () {
    socket.emit('chat', {
      message: $scope.message
    });
    $scope.message = '';
  };
});
