app.controller('TitleCtrl', function($scope, $window, $interval, messages) {
  var originalTitle = $window.document.title;
  var getParenTitle = function(unread) {
    return '(' + unread + ') ' + originalTitle;
  };
  var getUnreadTitle = function(unread) {
    var title = unread + ' new message';
    if (unread > 1) title += 's';
    return title;
  };

  var currentTitle = getParenTitle;
  var toggleTitle = function() {
    if (currentTitle === getParenTitle) {
      currentTitle = getUnreadTitle;
    } else {
      currentTitle = getParenTitle;
    }
  };

  var toggle;
  $scope.getTitle = function() {
    var unread = messages.stats.unread;
    if (unread > 0) {
      if (!angular.isDefined(toggle)) {
        toggle = $interval(toggleTitle, 1000);
      }
      return currentTitle(unread);
    } else {
      if (angular.isDefined(toggle)) {
        $interval.cancel(toggle);
        toggle = undefined;
        currentTitle = getParenTitle;
      };
      return originalTitle;
    }
  };
});

app.controller('ChatCtrl', function($scope, $window, socket, messages, dropdown, timer, DROPDOWN_THRESHOLD) {
  $scope.partnerName = 'Anonymous Tiger';
  $scope.messages = messages.get();
  $scope.state = null;
  $scope.dropdown = dropdown;
  $scope.playSound = true;

  var question;

  $scope.$watch('state', function(value) {
    if (value === 'waiting') {
      // FIXME: send this information before the browser closes!
      $window.onbeforeunload = function() {
        timer.stop('waiting');
        mixpanel.track('quit without match', {
          waitTime: timer.getDuration('waiting')
        });
      };
    } else if (value === 'chatting') {
      $window.onbeforeunload = function() {
        return 'Leaving this page will end your conversation.';
      };
      $window.onunload = function() {
        // FIXME: send this information before the browser closes!
        timer.stop('chatting');
        mixpanel.track('chat ended', {
          quit: true,
          duration: timer.getDuration('chatting'),
          question: question,
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
    messages.add({
      type: 'system',
      important: true,
      template: 'error'
    });
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
      template: 'entrance'
    });
  });

  socket.on('waiting', function(data) {
    messages.add({
      type: 'system',
      template: 'waiting'
    });
    $scope.state = 'waiting';

    timer.start('waiting');
  });

  socket.on('matched', function(data) {
    question = data.question;
    messages.add({
      type: 'system',
      template: 'matched',
      question: question
    });
    $scope.state = 'chatting';
    timer.start('chatting');

    timer.stop('waiting');
    mixpanel.track('chat matched', {
      waitTime: timer.getDuration('waiting'),
      question: question
    });
  });

  socket.on('chat message', function(data) {
    messages.add({
      type: 'chat',
      isPartner: data.name !== 'You',
      name: data.name,
      text: data.message
    });

    if (!dropdown.previouslyShown() &&
        messages.stats.sent >= DROPDOWN_THRESHOLD &&
        messages.stats.received >= DROPDOWN_THRESHOLD) {
      dropdown.show();
    }
  });

  socket.on('reveal', function(data) {
    $scope.partnerName = data.name;
    messages.add({
      type: 'system',
      template: 'partnerRevealed',
      partnerName: data.name,
      partnerLink: data.link
    });
    mixpanel.track('partner revealed', {
      messagesSent: messages.stats.sent,
      messagesReceived: messages.stats.received
    });
  });

  socket.on('finished', function(data) {
    messages.add({
      type: 'system',
      important: true,
      template: 'finished'
    });
    $scope.state = 'finished';

    messages.add({
      type: 'system',
      important: false,
      template: 'feedback'
    });

    timer.stop('chatting');
    mixpanel.track('chat ended', {
      quit: false,
      duration: timer.getDuration('chatting'),
      question: question,
      messagesSent: messages.stats.sent,
      messagesReceived: messages.stats.received
    });
  });

  socket.on('disconnect', function() {
    if ($scope.state !== 'finished') {
      messages.add({
        type: 'system',
        important: true,
        template: 'disconnected'
      });
      mixpanel.track('disconnected');
    }
    $scope.state = 'disconnected';
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
