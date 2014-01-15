var app = angular.module('pom', ['ngSanitize', 'ngAnimate']);

var loadMixpanel = function(window) {
  (function(e,b){if(!b.__SV){var a,f,i,g;window.mixpanel=b;a=e.createElement("script");a.type="text/javascript";a.async=!0;a.src=("https:"===e.location.protocol?"https:":"http:")+'//cdn.mxpnl.com/libs/mixpanel-2.2.min.js';f=e.getElementsByTagName("script")[0];f.parentNode.insertBefore(a,f);b._i=[];b.init=function(a,e,d){function f(b,h){var a=h.split(".");2==a.length&&(b=b[a[0]],h=a[1]);b[h]=function(){b.push([h].concat(Array.prototype.slice.call(arguments,0)))}}var c=b;"undefined"!==typeof d?c=b[d]=[]:d="mixpanel";c.people=c.people||[];c.toString=function(b){var a="mixpanel";"mixpanel"!==d&&(a+="."+d);b||(a+=" (stub)");return a};c.people.toString=function(){return c.toString(1)+".people (stub)"};i="disable track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config people.set people.set_once people.increment people.append people.track_charge people.clear_charges people.delete_user".split(" ");for(g=0;g<i.length;g++)f(c,i[g]);b._i.push([a,e,d])};b.__SV=1.2}})(window.document,window.mixpanel||[]);
  mixpanel.init("d1f916546eb11978e1501c003e2e5141");
};

var loadGoogleAnalytics = function(window) {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,window.document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-23357698-2', 'tigersanonymous.com');
  ga('send', 'pageview');
};

var loadFacebook = function(window) {
  (function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    ref.parentNode.insertBefore(js, ref);
  }(window.document));
};

app.run(function($window, $location) {
  loadMixpanel($window);
  loadGoogleAnalytics($window);

  var fbAppId;
  if ($location.host() === 'localhost') {
    fbAppId = '272759306207368';
    mixpanel.disable();
  } else {
    fbAppId = '190195584520995';
  }

  $window.fbAsyncInit = function() {
    FB.init({
      appId: fbAppId,
      status: true
    });
  };

  loadFacebook($window);
});
