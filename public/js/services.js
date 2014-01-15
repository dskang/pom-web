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
  var numUnread = 0;

  $window.onfocus = function() {
    $rootScope.$apply(function() {
      numUnread = 0;
    });
  };

  return {
    add: function(msg) {
      messages.push(msg);

      if (!$window.document.hasFocus()) {
        numUnread++;
      }
    },
    get: function() {
      return messages;
    },
    numUnread: function() {
      return numUnread;
    }
  };
});
