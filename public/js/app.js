var app = angular.module('chatterbox', ['ngSanitize']);

app.controller('ChatCtrl', function($scope, socket) {
  $scope.messages = [];
  $scope.state = null;

  socket.on('error', function() {
    // socket.io currently doesn't pass in custom error message
    // https://github.com/LearnBoost/socket.io/issues/545
    $scope.messages.push({
      type: 'leave',
      text: 'Sorry, you are either not using a computer at Princeton or are attempting to chat with more than one person at a time.'
    });
  });

  socket.on('connect', function() {
    $scope.state = 'connected';
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
    $scope.state = 'waiting';
  });

  socket.on('matched', function(data) {
    $scope.messages.push({
      type: 'system',
      text: data.message
    });
    $scope.state = 'chatting';
  });

  socket.on('chat', function(data) {
    $scope.messages.push({
      type: 'normal',
      text: data.message
    });
  });

  socket.on('exit', function(data) {
    $scope.messages.push({
      type: 'leave',
      text: data.message
    });
    $scope.state = 'finished';
  });

  socket.on('disconnect', function() {
    if ($scope.state !== 'finished') {
      $scope.messages.push({
        type: 'leave',
        text: 'You have been disconnected.'
      });
    }
    $scope.state = 'disconnected';
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
