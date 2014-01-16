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

app.controller('ChatCtrl', function($scope, $window, socket, messages, dropdown) {
  $scope.partnerName = 'Anonymous Tiger';
  $scope.messages = messages.get();
  $scope.state = null;
  $scope.dropdown = dropdown;

  $scope.$watch('state', function(value) {
    if (value === 'chatting') {
      $window.onbeforeunload = function() {
        return 'Leaving this page will end your conversation.';
      };
      $window.onunload = function() {
        mixpanel.track('chat ended', {
          quit: true,
          messagesSent: messages.stats.sent,
          messagesReceived: messages.stats.received
        });
      };
    } else {
      $window.onbeforeunload = null;
      $window.onunload = null;
    }
  });

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
    mixpanel.track('error');
  });

  socket.on('connect', function() {
    $scope.state = 'connected';
    mixpanel.track('chat joined');
  });

  socket.on('entrance', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
  });

  var startWait;
  socket.on('waiting', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
    $scope.state = 'waiting';

    startWait = Date.now();
  });

  socket.on('matched', function(data) {
    messages.add({
      type: 'system',
      text: data.message
    });
    $scope.state = 'chatting';

    if (startWait) {
      var endWait = Date.now();
      var waitTime = Math.floor((endWait - startWait) / 1000);
      mixpanel.track('chat matched', function() {
        waitTime: waitTime
      });
    } else {
      mixpanel.track('chat matched');
    }
  });

  socket.on('chat message', function(data) {
    messages.add({
      type: 'chat',
      isPartner: data.name !== 'You',
      name: data.name,
      text: data.message
    });

    var threshold = 5; // FIXME
    if (!dropdown.previouslyShown() &&
        messages.stats.sent >= threshold &&
        messages.stats.received >= threshold) {
      dropdown.show();
    }
  });

  socket.on('reveal', function(data) {
    $scope.partnerName = data.name;
    messages.add({
      type: 'reveal',
      partnerName: data.name,
      partnerLink: data.link
    });
    mixpanel.track('partner revealed');
  });

  socket.on('finished', function(data) {
    messages.add({
      type: 'warning',
      text: data.message
    });
    $scope.state = 'finished';

    mixpanel.track('chat ended', {
      quit: false,
      messagesSent: messages.stats.sent,
      messagesReceived: messages.stats.received
    });
  });

  socket.on('disconnect', function() {
    if ($scope.state !== 'finished') {
      messages.add({
        type: 'warning',
        text: 'You have been disconnected.'
      });
    }
    $scope.state = 'disconnected';
    mixpanel.track('disconnected');
  });

  $scope.sendMessage = function(e) {
    if (e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();
      if ($scope.message.length > 0) {
        socket.emit('chat message', {
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
