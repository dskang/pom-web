app.directive('scrollGlue', function() {
  return function(scope, element, attrs) {
    var el = element[0];
    var shouldScroll = attrs.scrollGlue;

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
