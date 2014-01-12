var app = angular.module('chatterbox', ['ngSanitize', 'ngAnimate']);

app.run(function($window, $location) {
  var appId;
  if ($location.host() === 'localhost') {
    appId = '272759306207368';
  } else {
    appId = '190195584520995';
  }
  $window.fbAsyncInit = function() {
    FB.init({
      appId: appId,
      status: true
    });
  };

  // Load the SDK asynchronously
  (function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
  }($window.document));
});
