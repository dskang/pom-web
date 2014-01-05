var threshold = 0;
var queue = require('./queue.js');
var myName = 'Me';
var theirName = 'Anonymous Tiger';
var conversation = require('./conversation.js');

exports.connectChatter = function (currentSocket, userID) {

  var thatUser;
  var thisUser = {socket: currentSocket, 
    ownID: userID, 
    partnerID: null, 
    startTime: null, 
    matchingHeuristic: null, 
    buttonDisplayed: false,
    ownClick: false, 
    partnerClick: false,
    messagesSent: 0, 
    messagesReceived: 0
  };

  thisUser.socket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });

  // put socket into the queue
  // FIXME: include a check so that someone won't end up chatting with themselves
  // FIXME: include a check that there isn't a way to DOS POM by having multiple windows open
  if (queue.length() <= threshold) {
    queue.addUser(thisUser);
    thisUser.socket.emit('waiting', {
      message: 'Waiting for partner to join.'
    });
    thisUser.socket.on('disconnect', function() {
      queue.removeUser(thisUser);
    });

    // match the socket with another from the queue
  } else {
    thatUser = queue.getPartner(thisUser);

    // populate thatUserID field of both thisUser and thatUser
    thatUser.partnerID = thisUser.ownID;
    thisUser.partnerID = thatUser.ownID;

    // populate startTime field of both users
    thatUser.startTime = Date.now();
    thisUser.startTime = Date.now();

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

      thisUser.messagesSent++;
      thatUser.messagesReceived++;

      thisUser.socket.emit('chat', {
        message: myName + ': ' + data.message
      });
      thatUser.socket.emit('chat', {
        message: theirName + ': ' + data.message
      });
    });

    thatUser.socket.on('chat', function(data) {

      thatUser.messagesSent++;
      thisUser.messagesReceived++;

      thisUser.socket.emit('chat', {
        message: theirName + ': ' + data.message
      });
      thatUser.socket.emit('chat', {
        message: myName + ': ' + data.message
      });
    });

    thisUser.socket.on('reveal-button', function(data) {
      thisUser.buttonDisplayed = true;
    });

    thatUser.socket.on('reveal-button', function(data) {
      thatUser.buttonDisplayed = true;
    })
  }
};
