var allSockets = null;
var threshold = 0;
var queue = new Queue();
var myName = 'Me';
var theirName = 'Anonymous Tiger';

exports.setSockets = function (sockets) {
  allSockets = sockets;
};

exports.connectChatter = function (currentSocket) {
  var partner;

  currentSocket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });

  if (queue.length() <= threshold) {
    queue.addItem(currentSocket);
    currentSocket.emit('waiting', {
      message: 'Waiting for partner to join.'
    });
    currentSocket.on('disconnect', function() {
      queue.removeItem(currentSocket);
    });
  } else {
    partner = queue.getItem();
    var connectedMessage = {
      message: 'Connected! Go ahead and start chatting.'
    };
    currentSocket.emit('ready', connectedMessage);
    partner.emit('ready', connectedMessage);

    var disconnectedMessage = {
      message: theirName + ' has disconnected. Refresh the page to start another chat!'
    };
    currentSocket.on('disconnect', function() {
      partner.emit('exit', disconnectedMessage);
    });
    partner.on('disconnect', function() {
      currentSocket.emit('exit', disconnectedMessage);
    });

    currentSocket.on('chat', function(data) {
      currentSocket.emit('chat', {
        message: myName + ': ' + data.message
      });
      partner.emit('chat', {
        message: theirName + ': ' + data.message
      });
    });

    partner.on('chat', function(data) {
      currentSocket.emit('chat', {
        message: theirName + ': ' + data.message
      });
      partner.emit('chat', {
        message: myName + ': ' + data.message
      });
    });
  }
};

exports.failure = function (socket) {
  socket.emit('error', {
    message: 'Please log in to the chatroom.'
  });
};

function Queue () {
  this.array = new Array();
  this.addItem = function(item) {
    this.array.push(item);
  }
  this.getItem = function() {
    return this.array.shift();
  }
  this.removeItem = function(item) {
    var location = this.array.indexOf(item);
    if (location !== -1) {
      this.array.splice(location, 1);
    }
  }
  this.length = function() {
   return this.array.length;
  }
};