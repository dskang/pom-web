app.filter('linkyNewlines', function() {
  return function(input) {
    // NB: 'linky' outputs new lines (\n) as html escaped tabs
    return input.replace(/&#10;/g, '<br/>');
  }
});
