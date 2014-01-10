app.filter('newlines', function() {
  return function(input) {
    return input.replace(/\n/g, '<br/>');
  }
});
