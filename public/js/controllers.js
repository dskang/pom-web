app.controller('ChatCtrl', function($scope, $window, socket) {
  $scope.messages = [];
  $scope.state = null;
  $scope.showDropdown = false;
  $scope.dropdownShown = false;
  $scope.selfRevealed = false;

  $scope.$watch('state', function(value) {
    if (value === 'chatting') {
      $window.onbeforeunload = function() {
        return 'Leaving this page will end your conversation.';
      };
    } else {
      $window.onbeforeunload = null;
    }
  });

  $scope.revealIdentity = function() {
    var sendIdentity = function() {
      FB.api('/me', function(response) {
        socket.emit('identity', {
          name: response.name,
          link: response.link
        });
      });
      $scope.$apply(function() {
        $scope.messages.push({
          type: 'system',
          text: 'Identities will be revealed when both parties have opted to remove anonymization.'
        });
      });
    };

    // Verify that the Facebook account seems legitimate
    var verifyIdentity = function() {
      FB.api('/me/friends?limit=100', function(response) {
        if (response.data.length === 100) {
          sendIdentity();
        } else {
          $scope.$apply(function() {
            $scope.messages.push({
              type: 'warning',
              text: 'Unable to remove anonymization: Your Facebook account does not appear to be legitimate.'
            });
          });
        }
      });
    };

    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        verifyIdentity();
      } else {
        FB.Event.subscribe('auth.login', function(response) {
          if (response.status === 'connected') {
            verifyIdentity();
          }
        });
        FB.login();
      }
    });

    $scope.showDropdown = false;
    $scope.selfRevealed = true;
  };

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
        type: 'warning',
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

    var threshold = 1; // FIXME
    if (!$scope.dropdownShown &&
        messagesSent.user >= threshold &&
        messagesSent.partner >= threshold) {
      $scope.showDropdown = true;
      $scope.dropdownShown = true;
      socket.emit('dropdown displayed');
    }
  });

  socket.on('reveal', function(data) {
    $scope.messages.push({
      type: 'reveal',
      partnerName: data.name,
      partnerLink: data.link
    });
  });

  socket.on('exit', function(data) {
    $scope.messages.push({
      type: 'warning',
      text: data.message
    });
    $scope.state = 'finished';
  });

  socket.on('disconnect', function() {
    if ($scope.state !== 'finished') {
      $scope.messages.push({
        type: 'warning',
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
