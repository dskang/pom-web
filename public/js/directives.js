app.directive('pomScrollGlue', function($timeout) {
  return function(scope, element) {
    var el = element[0];
    var shouldScroll = true;

    function scrollToBottom() {
      el.scrollTop = el.scrollHeight;
    }

    function isScrolledToBottom() {
      return el.scrollTop + el.clientHeight >= el.scrollHeight;
    };

    element.bind('scroll', function() {
      shouldScroll = isScrolledToBottom();
    });

    scope.$watch(function() {
      if (shouldScroll) {
        scrollToBottom();
      }
    });

    // scroll to bottom if user sends message or receives system message
    scope.$watch('messages.length', function(length) {
      if (length === 0) return;
      var msg = scope.messages[length - 1];
      var sentMessage = (msg.type === 'chat' && msg.name === 'You');
      var receivedSystemMessage = msg.type === 'system';
      if (sentMessage || receivedSystemMessage) {
        $timeout(function() {
          scrollToBottom();
        });
      }
    });
  };
});

app.directive('pomFocusOnChat', function($timeout) {
  return function(scope, element) {
    scope.$watch('state', function(value) {
      if (value === 'chatting') {
        $timeout(function() {
          element[0].focus();
        });
      }
    });
  };
});

app.directive('pomPlayOnMessage', function($window) {
  return function(scope, element) {
    scope.$watch('messages.length', function(length) {
      if (scope.playSound && !$window.document.hasFocus()) {
        if (length === 0) return;
        var msg = scope.messages[length - 1];
        if (msg.type === 'chat' && msg.name !== 'You') {
          element[0].play();
        }
      }
    });
  };
});
