var app = angular.module('chatterbox', ['ngSanitize']);

app.run(function($window) {
  $window.fbAsyncInit = function() {
    FB.init({
      // appId      : '190195584520995',
      appId      : '272759306207368',
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });

    // Fired for any authentication related change
    FB.Event.subscribe('auth.authResponseChange', function(response) {
      if (response.status === 'connected') {
        // User has logged in to the app
        testAPI();
      } else if (response.status === 'not_authorized') {
        // User is logged into Facebook but not into the app
        FB.login();
      } else {
        // User is not not logged into Facebook
        FB.login();
      }
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

  function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Good to see you, ' + response.name + '.');
    });
  }
});
