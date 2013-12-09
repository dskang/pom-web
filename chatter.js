var threshold = 0;
var queue = new Queue();
var myName = 'Me';
var theirName = 'Anonymous Tiger';
var conversation = require('./conversation.js');

exports.connectChatter = function (currentSocket, userID) {

  var thatUser;
  var thisUser = {socket: currentSocket, ownID: userID, partnerID: null, startTime: null, matchingHeuristic: 0, clicked: false};

  thisUser.socket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });
  
  // put socket into the queue
  // FIXME: include a check so that someone won't end up chatting with themselves
  if (queue.length() <= threshold) {
    queue.addItem(thisUser);
    thisUser.socket.emit('waiting', {
      message: 'Waiting for partner to join.'
    });
    thisUser.socket.on('disconnect', function() {
      queue.removeItem(thisUser);
    });

    // match the socket with another from the queue
  } else {
    thatUser = queue.getItem();

    // populate thatUserID field of both thisUser and thatUser
    thatUser.partnerID = thisUser.ownID;
    thisUser.partnerID = thatUser.ownID;
    thatUser.startTime = Date.now();
    thisUser.startTime = Date.now();

    // FIXME: Implement matching heuristic

    var connectedMessage = {
      message: 'Connected! Go ahead and start chatting.'
    };
    
    thisUser.socket.emit('ready', connectedMessage);
    thatUser.socket.emit('ready', connectedMessage);

    var disconnectedMessage = {
      message: theirName + ' has disconnected. Refresh the page to start another chat!'
    };

    thisUser.socket.on('disconnect', function() {
      thatUser.socket.emit('exit', disconnectedMessage);
      conversation.save(thatUser);
    });

    thatUser.socket.on('disconnect', function() {
      thisUser.socket.emit('exit', disconnectedMessage);
      conversation.save(thisUser);
    });

    thisUser.socket.on('chat', function(data) {
      thisUser.socket.emit('chat', {
        message: myName + ': ' + data.message
      });
      thatUser.socket.emit('chat', {
        message: theirName + ': ' + data.message
      });
    });

    thatUser.socket.on('chat', function(data) {
      thisUser.socket.emit('chat', {
        message: theirName + ': ' + data.message
      });
      thatUser.socket.emit('chat', {
        message: myName + ': ' + data.message
      });
    });
  }
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