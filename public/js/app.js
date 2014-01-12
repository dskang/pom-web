var app = angular.module('chatterbox', ['ngSanitize']);

app.run(function($window) {
  $window.fbAsyncInit = function() {
    FB.init({
      // appId      : '190195584520995',
      appId      : '272759306207368',
      status     : true
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
