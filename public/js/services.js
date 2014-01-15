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
