app.directive('pomScrollGlue', function() {
  return function(scope, element) {
    var el = element[0];
    var shouldScroll = true;

    function scrollToBottom() {
      el.scrollTop = el.scrollHeight;
    }

    function shouldActivateAutoScroll() {
      return el.scrollTop + el.clientHeight >= el.scrollHeight;
    };

    element.bind('scroll', function() {
      shouldScroll = shouldActivateAutoScroll();
    });

    scope.$watch(function() {
      if (shouldScroll) {
        scrollToBottom();
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
