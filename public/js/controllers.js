app.controller('TitleCtrl', function($scope, $window, messages) {
  var originalTitle = $window.document.title;
  $scope.getTitle = function() {
    var title = originalTitle;
    var numUnread = messages.stats.unread;
    if (numUnread > 0) {
      title = '(' + numUnread + ') ' + title;
    }
    return title;
  };
});

app.controller('ChatCtrl', function($scope, $window, socket, messages) {
  $scope.partnerName = 'Anonymous Tiger';
  $scope.messages = messages.get();
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
    $scope.showDropdown = false;
    $scope.selfRevealed = true;

    var sendIdentity = function() {
      FB.api('/me', function(response) {
        socket.emit('identity', {
          name: response.name,
          link: response.link
        });
      });
      $scope.$apply(function() {
        messages.add({
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
            messages.add({
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
        FB.login(function(response) {
          if (response.authResponse) {
            verifyIdentity();
          } else {
            $scope.$apply(function() {
              $scope.showDropdown = true;
              $scope.selfRevealed = false;
            });
          }
        });
      }
    });
  };

  socket.on('error', function() {
    // socket.io currently doesn't pass in custom error message
    // https://github.com/LearnBoost/socket.io/issues/545
    var msgs = [
      "Unable to connect. Please ensure the following:",
      "1. You are using a computer connected to Princeton's network.",
      "2. You are not already chatting with a user.",
      "3. You are using a modern web browser that supports WebSockets.",
      "4. You have a working Internet connection."
    ];
    for (var i = 0; i < msgs.length; i++) {
      messages.add({
        type: 'warning',
        text: msgs[i]
      });
    }
    $scope.state = 'error';
  });

  socket.on('connect', function() {
    $scope.state = 'connected';
  });

  socket.on('entrance', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
  });

  socket.on('waiting', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
    $scope.state = 'waiting';
  });

  socket.on('matched', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
    $scope.state = 'chatting';
  });

  socket.on('chat', function(data) {
    messages.add({
      type: 'chat',
      isPartner: data.name !== 'You',
      name: data.name,
      text: data.message
    });

    var threshold = 5; // FIXME
    if (!$scope.dropdownShown &&
        messages.stats.sent >= threshold &&
        messages.stats.received >= threshold) {
      $scope.showDropdown = true;
      $scope.dropdownShown = true;
      socket.emit('dropdown displayed');
    }
  });

  socket.on('reveal', function(data) {
    $scope.partnerName = data.name;
    messages.add({
      type: 'reveal',
      partnerName: data.name,
      partnerLink: data.link
    });
  });

  socket.on('exit', function(data) {
    messages.add({
      type: 'warning',
      text: data.message
    });
    $scope.state = 'finished';
  });

  socket.on('disconnect', function() {
    if ($scope.state !== 'finished') {
      messages.add({
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
        prevMessageLength = 0;
        socket.emit('not typing');
      }
    }
  };

  // Realtime typing
  var prevMessageLength = 0;
  $scope.updateTyping = function() {
    if (prevMessageLength === 0 && $scope.message.length > 0) {
      socket.emit('typing');
    } else if ($scope.message.length === 0) {
      socket.emit('not typing');
    }
    prevMessageLength = $scope.message.length;
  };

  socket.on('typing', function() {
    $scope.partnerTyping = true;
  });

  socket.on('not typing', function() {
    $scope.partnerTyping = false;
  });
});
