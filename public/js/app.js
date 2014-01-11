var app = angular.module('chatterbox', ['ngSanitize']);

app.controller('ChatCtrl', function($scope, socket) {
  $scope.messages = [];

  socket.on('error', function() {
    // socket.io currently doesn't pass in custom error message
    // https://github.com/LearnBoost/socket.io/issues/545
    $scope.messages.push({
      type: 'leave',
      text: 'Sorry, you are either not using a computer at Princeton or are attempting to chat with more than one person at a time.'
    });
  });

  socket.on('disconnect', function() {
    $scope.messages.push({
      type: 'leave',
      text: 'You have been disconnected. Refresh the page to start another chat!'
    });
  });

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

  $scope.sendMessage = function(e) {
    if (e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();
      socket.emit('chat', {
        message: $scope.message
      });
      $scope.message = '';
    }
  };
});
