app.factory('socket', function ($rootScope) {
  var socket = io.connect(null, {
    reconnect: false
  });
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.factory('messages', function($rootScope, $window) {
  var messages = [];
  var stats = {
    unread: 0,
    sent: 0,
    received: 0
  };

  $window.onfocus = function() {
    $rootScope.$apply(function() {
      stats.unread = 0;
    });
  };

  return {
    add: function(message) {
      messages.push(message);

      if (message.type === 'chat') {
        if (message.name === 'You') {
          stats.sent++;
        } else {
          stats.received++;
        }

        if (!$window.document.hasFocus()) {
          stats.unread++;
        }
      }
    },
    get: function() {
      return messages;
    },
    stats: stats
  };
});

app.factory('dropdown', function($rootScope, socket, messages) {
  var showDropdown = false;
  var dropdownShown = false;
  var selfRevealed = false;

  // Send the identity to the server
  var sendIdentity = function() {
    FB.api('/me', function(response) {
      socket.emit('identity', {
        name: response.name,
        link: response.link
      });
    });
    $rootScope.$apply(function() {
      messages.add({
        type: 'system',
        text: 'Identities will be revealed when both parties have opted to remove anonymization.'
      });
    });
  };

  // Verify that the Facebook account seems legitimate
  var verifyIdentity = function() {
    FB.api('/me/friends?limit=100', function(response) {
      if (response.data.length === 100) {
        sendIdentity();
      } else {
        $rootScope.$apply(function() {
          messages.add({
            type: 'warning',
            text: 'Unable to remove anonymization: Your Facebook account does not appear to be legitimate.'
          });
        });
      }
    });
  };

  var revealIdentity = function() {
    selfRevealed = true;

    FB.getLoginStatus(function(response) {
      if (response.status === 'connected') {
        verifyIdentity();
      } else {
        FB.login(function(response) {
          if (response.authResponse) {
            verifyIdentity();
          } else {
            $rootScope.$apply(function() {
              showDropdown = true;
              selfRevealed = false;
            });
          }
        });
      }
    });
  };

  return {
    show: function() {
      if (!dropdownShown) {
        socket.emit('dropdown displayed');
      }
      showDropdown = true;
      dropdownShown = true;
    },
    hide: function() {
      showDropdown = false;
    },
    previouslyShown: function() {
      return dropdownShown;
    },
    shouldShowFull: function() {
      return showDropdown;
    },
    shouldShowMinimized: function() {
      return !showDropdown && dropdownShown && !selfRevealed;
    },
    accept: function() {
      showDropdown = false;
      revealIdentity();
    }
  };
});
