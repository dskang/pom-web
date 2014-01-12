app.controller('ChatCtrl', function($scope, socket) {
  $scope.messages = [];
  $scope.state = null;
  $scope.showDropdown = false;

  var messagesSent = {
    user: 0,
    partner: 0
  };

  socket.on('error', function() {
    // socket.io currently doesn't pass in custom error message
    // https://github.com/LearnBoost/socket.io/issues/545
    var messages = [
      "Unable to connect. Please ensure the following:",
      "1. You are using a computer connected to Princeton's network.",
      "2. You are not already chatting with a user.",
      "3. You are using a modern web browser that supports WebSockets.",
      "4. You have a working Internet connection."
    ];
    for (var i = 0; i < messages.length; i++) {
      $scope.messages.push({
        type: 'leave',
        text: messages[i]
      });
    }
    $scope.state = 'error';
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
      type: 'chat',
      isPartner: data.name !== 'You',
      name: data.name,
      text: data.message
    });

    if (data.name === 'You') {
      messagesSent.user++;
    } else {
      messagesSent.partner++;
    }

    var threshold = 1;
    if (messagesSent.user >= threshold && messagesSent.partner >= threshold) {
      $scope.showDropdown = true;
    }
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
      if ($scope.message.length > 0) {
        socket.emit('chat', {
          message: $scope.message
        });
        $scope.message = '';
      }
    }
  };
});
